import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { evidenceFilename, evidencePath, saveEvidence } from '../lib/privacy';

const EvidenceDownload = ({ caseId }) => {
  const [downloading, setDownloading] = useState(false);
  const request = useRef(null);

  useEffect(() => () => request.current?.abort(), [caseId]);

  const download = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setDownloading(true);
    try {
      const response = await api.get(evidencePath(caseId), {
        responseType: 'blob',
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        saveEvidence(response.data, evidenceFilename(response.headers['content-disposition'], `evidence-${caseId}`));
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        toast.error(err.response?.status === 403
          ? 'This evidence is private. You no longer have access.'
          : err.response?.status === 404
            ? 'No evidence file is available for this case.'
            : 'Evidence could not be downloaded. Please try again.');
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setDownloading(false);
    }
  };

  return (
    <Button variant="outline" onClick={download} disabled={downloading} className="gap-2">
      <Download className="h-4 w-4" />{downloading ? 'Downloading...' : 'Download evidence'}
    </Button>
  );
};

export default EvidenceDownload;