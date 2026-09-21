import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck, ThumbsUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';

const PAGE_SIZE = 20;

const formatDate = (value) => {
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2])
    : new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : '';
};

const RecentGrievancesPage = () => {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [votingIds, setVotingIds] = useState([]);
  const votesInFlight = useRef(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const fetchPage = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/grievances/all', {
          params: { page, size: PAGE_SIZE },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const data = response.data;
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1));
          return;
        }
        setResult(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.response?.status === 403
          ? 'The community feed is not available to your account.'
          : 'Published summaries could not be loaded. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchPage();
    return () => controller.abort();
  }, [page, reload]);

  const toggleUpvote = async (publicId) => {
    if (votesInFlight.current.has(publicId)) return;
    votesInFlight.current.add(publicId);
    setVotingIds([...votesInFlight.current]);
    try {
      const { data } = await api.post(`/grievances/public/${encodeURIComponent(publicId)}/upvote`);
      setResult(previous => ({
        ...previous,
        content: previous.content.map(summary => summary.publicId === publicId
          ? { ...summary, upvoteCount: data.upvoteCount, hasUpvoted: data.hasUpvoted }
          : summary),
      }));
    } catch (err) {
      toast.error(err.response?.status === 403 || err.response?.status === 404
        ? 'This summary is no longer available for voting.'
        : 'Your vote could not be saved. Please try again.');
      setReload(previous => previous + 1);
    } finally {
      votesInFlight.current.delete(publicId);
      setVotingIds([...votesInFlight.current]);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-5xl mx-auto p-4 md:p-10 space-y-6">
        <header className="space-y-2">
          <Badge variant="outline" className="gap-2 text-primary"><ShieldCheck className="h-4 w-4" /> Reviewed for publication</Badge>
          <h1 className="text-3xl font-bold">Community Grievances</h1>
          <p className="text-sm text-muted-foreground">Published summaries only. Original cases, evidence, feedback, and participant history remain private.</p>
        </header>

        {loading ? (
          <p role="status" className="py-12 text-center text-muted-foreground">Loading published summaries...</p>
        ) : error ? (
          <div role="alert" className="py-12 text-center space-y-4">
            <p>{error}</p>
            <Button variant="outline" onClick={() => setReload(previous => previous + 1)}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
          </div>
        ) : result.content.length === 0 ? (
          <section className="py-12 border-y text-center space-y-2">
            <h2 className="text-xl font-bold">No reviewed summaries published yet</h2>
            <p className="text-sm text-muted-foreground">Grievances are private by default. A summary appears here only after an administrator reviews and publishes it.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {result.content.map(summary => (
              <Card key={summary.publicId} className="rounded-lg shadow-sm">
                <CardContent className="p-5 sm:p-6 space-y-4 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2 min-w-0 break-words"><Building2 className="h-4 w-4 shrink-0" />{summary.departmentName}</span>
                    <span>{formatDate(summary.createdDate)}</span>
                  </div>
                  <h2 className="text-xl font-bold break-words [overflow-wrap:anywhere]">{summary.publicTitle}</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{summary.publicSummary}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <Badge variant="secondary">{summary.status?.replaceAll('_', ' ')}</Badge>
                    <Button
                      variant={summary.hasUpvoted ? 'secondary' : 'outline'}
                      size="sm"
                      aria-label={`Upvote: ${summary.publicTitle}`}
                      aria-pressed={Boolean(summary.hasUpvoted)}
                      disabled={votingIds.includes(summary.publicId)}
                      onClick={() => toggleUpvote(summary.publicId)}
                      className="gap-2 min-w-20"
                    >
                      <ThumbsUp className={`h-4 w-4 ${summary.hasUpvoted ? 'fill-current' : ''}`} />
                      {summary.upvoteCount ?? 0}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <nav aria-label="Community pages" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button variant="outline" size="sm" disabled={loading || page === 0} onClick={() => setPage(previous => previous - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {!loading && !error && `Page ${result.totalPages ? page + 1 : 0} of ${result.totalPages} (${result.totalElements} published)`}
          </span>
          <Button variant="outline" size="sm" disabled={loading || Boolean(error) || page + 1 >= result.totalPages} onClick={() => setPage(previous => previous + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </nav>
      </div>
    </div>
  );
};

export default RecentGrievancesPage;
