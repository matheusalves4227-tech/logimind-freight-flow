import { useEffect, useRef } from 'react';

interface UseRealtimeDocumentsProps {
  onNewDocument?: () => void;
}

export const useRealtimeDocuments = ({ onNewDocument }: UseRealtimeDocumentsProps = {}) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Poll every 30 seconds for document changes (realtime removed for security)
    intervalRef.current = setInterval(() => {
      if (onNewDocument) {
        onNewDocument();
      }
    }, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onNewDocument]);
};
