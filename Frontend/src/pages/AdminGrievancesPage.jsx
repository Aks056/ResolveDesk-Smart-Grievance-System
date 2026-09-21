import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const PAGE_SIZE = 20;

const formatDate = (value) => {
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2])
    : new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : '-';
};

const AdminGrievancesPage = () => {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPage = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/admin/grievances', {
          params: { page, size: PAGE_SIZE },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (page > 0 && page >= data.totalPages) {
          setPage(Math.max(0, data.totalPages - 1));
          return;
        }
        setResult(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.response?.status === 403
          ? 'You do not have permission to view all cases.'
          : 'Cases could not be loaded. Please try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchPage();
    return () => controller.abort();
  }, [page, reload]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-7xl mx-auto p-4 md:p-10 space-y-6">
        <header className="space-y-2">
          <Badge variant="outline" className="gap-2"><ShieldAlert className="h-4 w-4" /> Admin only</Badge>
          <h1 className="text-3xl font-bold">All Cases</h1>
        </header>

        {loading ? (
          <p role="status" className="py-12 text-center text-muted-foreground">Loading cases...</p>
        ) : error ? (
          <div role="alert" className="py-12 text-center space-y-4">
            <p>{error}</p>
            <Button variant="outline" onClick={() => setReload(previous => previous + 1)}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        ) : result.content.length === 0 ? (
          <p role="status" className="py-12 border-y text-center text-muted-foreground">No cases found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-sm">
              <caption className="sr-only">All private cases, including unpublished cases</caption>
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="w-[34%] p-3">Case / Reference</th>
                  <th scope="col" className="w-[17%] p-3">Status</th>
                  <th scope="col" className="w-[20%] p-3">Department</th>
                  <th scope="col" className="w-[14%] p-3">Created</th>
                  <th scope="col" className="w-[15%] p-3">Publication</th>
                </tr>
              </thead>
              <tbody>
                {result.content.map(grievance => (
                  <tr key={grievance.id} className="border-b align-top hover:bg-muted/40">
                    <td className="p-3 [overflow-wrap:anywhere]">
                      <Link to={`/grievances/${grievance.id}`} className="font-semibold text-primary hover:underline focus-visible:underline">
                        {grievance.title}
                      </Link>
                      <div className="mt-1 text-xs text-muted-foreground">{grievance.grievanceNumber || `#${grievance.id}`}</div>
                    </td>
                    <td className="p-3 [overflow-wrap:anywhere]">{grievance.status?.replaceAll('_', ' ') || '-'}</td>
                    <td className="p-3 [overflow-wrap:anywhere]">{grievance.departmentName || 'Unassigned'}</td>
                    <td className="p-3">{formatDate(grievance.createdAt)}</td>
                    <td className="p-3"><Badge variant={grievance.published ? 'secondary' : 'outline'}>{grievance.published ? 'Published' : 'Unpublished'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav aria-label="Admin case pages" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button variant="outline" size="sm" disabled={loading || page === 0} onClick={() => setPage(previous => previous - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {!loading && !error && `Page ${result.totalPages ? page + 1 : 0} of ${result.totalPages} (${result.totalElements} cases)`}
          </span>
          <Button variant="outline" size="sm" disabled={loading || Boolean(error) || page + 1 >= result.totalPages} onClick={() => setPage(previous => previous + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </nav>
      </div>
    </div>
  );
};

export default AdminGrievancesPage;