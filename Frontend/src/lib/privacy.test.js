import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evidenceFilename, evidencePath, getOfficerName, saveEvidence } from './privacy.js';

test('evidence paths accept only case IDs, never supplied URLs', () => {
  assert.equal(evidencePath(42), '/grievances/42/attachments/evidence');
  for (const value of ['https://example.com/file', '../42', '42?token=x', '/uploads/file', null, undefined]) {
    assert.throws(() => evidencePath(value), /Invalid case ID/);
  }
});

test('minimal officer DTOs support optional fullName and split names', () => {
  assert.equal(getOfficerName({ firstName: 'Asha', lastName: 'Rao' }), 'Asha Rao');
  assert.equal(getOfficerName({ fullName: ' Officer Rao ', firstName: 'Asha' }), 'Officer Rao');
  assert.equal(getOfficerName({ firstName: 'Asha' }), 'Asha');
  assert.equal(getOfficerName(null), 'Officer');
});

test('download filenames support standard and UTF-8 content disposition', () => {
  assert.equal(evidenceFilename('attachment; filename="report.pdf"'), 'report.pdf');
  assert.equal(evidenceFilename("attachment; filename=backup.pdf; filename*=UTF-8''review%20notes.pdf"), 'review notes.pdf');
  assert.equal(evidenceFilename("attachment; filename=backup.pdf; filename*=UTF-8''bad%ZZ"), 'backup.pdf');
  assert.equal(evidenceFilename(undefined, 'evidence-42'), 'evidence-42');
});

test('download filenames discard paths, control characters and reserved names', () => {
  assert.equal(evidenceFilename('attachment; filename="../../report.pdf"'), 'report.pdf');
  assert.equal(evidenceFilename('attachment; filename="bad\u0000\u202ename?.pdf"'), 'badname_.pdf');
  for (const name of ['CON', 'nul.txt', 'LPT1.pdf', '..', ' ']) {
    assert.equal(evidenceFilename(`attachment; filename="${name}"`, 'evidence-42'), 'evidence-42');
  }
});

test('blob downloads force download and clean up the anchor and object URL', (context) => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const anchor = { click: context.mock.fn(), remove: context.mock.fn() };
  const appendChild = context.mock.fn();
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => anchor, body: { appendChild } },
  });
  context.after(() => {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
  });
  const createObjectURL = context.mock.method(URL, 'createObjectURL', () => 'blob:test-evidence');
  const revokeObjectURL = context.mock.method(URL, 'revokeObjectURL', () => {});
  context.mock.method(globalThis, 'setTimeout', (callback) => callback());

  saveEvidence(new Blob(['evidence'], { type: 'text/html' }), 'evidence-42');

  assert.equal(createObjectURL.mock.calls[0].arguments[0].type, 'application/octet-stream');
  assert.equal(anchor.href, 'blob:test-evidence');
  assert.equal(anchor.download, 'evidence-42');
  assert.equal(appendChild.mock.callCount(), 1);
  assert.equal(anchor.click.mock.callCount(), 1);
  assert.equal(anchor.remove.mock.callCount(), 1);
  assert.equal(revokeObjectURL.mock.calls[0].arguments[0], 'blob:test-evidence');
});