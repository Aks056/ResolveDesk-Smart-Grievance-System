export const getOfficerName = (officer) => officer?.fullName?.trim()
  || [officer?.firstName, officer?.lastName].filter(Boolean).join(' ')
  || 'Officer';

export const evidencePath = (caseId) => {
  if (!/^\d+$/.test(String(caseId))) throw new Error('Invalid case ID');
  return `/grievances/${caseId}/attachments/evidence`;
};

export const evidenceFilename = (disposition, fallback = 'evidence') => {
  const header = typeof disposition === 'string' ? disposition : '';
  const extended = header.match(/(?:^|;)\s*filename\*\s*=\s*UTF-8'[^']*'([^;]*)/i);
  const regular = header.match(/(?:^|;)\s*filename\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^;]*))/i);
  let filename = regular?.[1]?.replace(/\\(.)/g, '$1') || regular?.[2]?.trim();
  if (extended) {
    try {
      filename = decodeURIComponent(extended[1].trim());
    } catch {
      filename ||= fallback;
    }
  }
  const basename = (filename || fallback).split(/[/\\]/).pop();
  const safe = Array.from(basename).filter(character => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127 && !(code >= 0x202a && code <= 0x202e)
      && !(code >= 0x2066 && code <= 0x2069);
  }).join('').replace(/[<>:"|?*]/g, '_').replace(/^[. ]+|[. ]+$/g, '').slice(0, 180);
  return safe && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe) ? safe : fallback;
};

export const saveEvidence = (data, filename) => {
  const objectUrl = URL.createObjectURL(new Blob([data], { type: 'application/octet-stream' }));
  const anchor = document.createElement('a');
  try {
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  }
};