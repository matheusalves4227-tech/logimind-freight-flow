import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeDocumentsProps {
  onNewDocument?: () => void;
}

export const useRealtimeDocuments = ({ onNewDocument }: UseRealtimeDocumentsProps = {}) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('driver-documents-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_documents',
        },
        (payload) => {
          console.log('Novo documento recebido:', payload);
          
          toast({
            title: 'Novo Documento Enviado',
            description: 'Um motorista enviou um novo documento para revisão.',
            duration: 5000,
          });

          if (onNewDocument) {
            onNewDocument();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_documents',
        },
        (payload) => {
          console.log('Documento atualizado:', payload);
          
          // Notifica apenas se o status de verificação mudou
          if (payload.new.is_verified !== payload.old.is_verified) {
            const status = payload.new.is_verified 
              ? 'aprovado' 
              : payload.new.is_verified === false 
              ? 'rejeitado' 
              : 'pendente';
            
            toast({
              title: 'Status de Documento Atualizado',
              description: `Um documento foi ${status}.`,
              duration: 4000,
            });

            if (onNewDocument) {
              onNewDocument();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, onNewDocument]);
};
