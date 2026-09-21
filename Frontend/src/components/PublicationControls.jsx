import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Globe, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

const PublicationControls = ({ grievance, onUpdated }) => {
  const [publicTitle, setPublicTitle] = useState(grievance.publicTitle || '');
  const [publicSummary, setPublicSummary] = useState(grievance.publicSummary || '');
  const [reviewed, setReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const valid = publicTitle.trim().length > 0 && publicTitle.length <= 200
    && publicSummary.trim().length > 0 && publicSummary.length <= 2000;

  const savePublication = async (published) => {
    if (saving || (published && (!valid || !reviewed))) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/grievances/${grievance.id}/publication`, {
        published,
        publicTitle: published ? publicTitle.trim() : (grievance.publicTitle || ''),
        publicSummary: published ? publicSummary.trim() : (grievance.publicSummary || ''),
      });
      setReviewed(false);
      toast.success(published ? 'Reviewed summary published' : 'Summary unpublished');
      await onUpdated();
    } catch (err) {
      setError(err.response?.status === 403
        ? 'Only an administrator can change publication.'
        : 'Publication could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4 border-y py-6" aria-labelledby="publication-heading">
      <h2 id="publication-heading" className="text-lg font-bold flex items-center gap-2">
        <Globe className="h-5 w-5" /> Community publication
      </h2>
      <p className="text-sm font-semibold">{grievance.published ? 'Reviewed summary published' : 'Private: not published'}</p>
      <p className="text-sm text-muted-foreground">Exclude names, contact information, identifying details, and evidence. Only the separately reviewed title and summary will be public; the original case stays private.</p>
      <div className="space-y-2">
        <label htmlFor="public-title" className="text-sm font-semibold">Reviewed public title</label>
        <Input id="public-title" value={publicTitle} maxLength={200} disabled={saving} onChange={event => { setPublicTitle(event.target.value); setReviewed(false); }} />
        <p className="text-xs text-muted-foreground">{publicTitle.length}/200</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="public-summary" className="text-sm font-semibold">Reviewed public summary</label>
        <Textarea id="public-summary" value={publicSummary} maxLength={2000} rows={6} disabled={saving} onChange={event => { setPublicSummary(event.target.value); setReviewed(false); }} />
        <p className="text-xs text-muted-foreground">{publicSummary.length}/2000</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={reviewed} disabled={saving} onChange={event => setReviewed(event.target.checked)} />
        I reviewed this text and removed personal and sensitive information.
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={saving || !valid || !reviewed} onClick={() => savePublication(true)} className="gap-2 whitespace-normal h-auto min-h-10">
          <Globe className="h-4 w-4 shrink-0" /> Publish reviewed summary
        </Button>
        {grievance.published && <Button variant="outline" disabled={saving} onClick={() => savePublication(false)} className="gap-2"><LockKeyhole className="h-4 w-4" /> Unpublish</Button>}
      </div>
    </section>
  );
};

export default PublicationControls;