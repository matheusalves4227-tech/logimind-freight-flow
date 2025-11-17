import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewer } from '@/components/admin/DocumentViewer';
import { formatDate } from '@/lib/formatters';
import { useRealtimeDocuments } from '@/hooks/useRealtimeDocuments';

interface DriverDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  is_verified: boolean | null;
  created_at: string;
  driver_profile_id: string;
  driver_name: string;
  driver_cpf: string;
}

const AdminDocuments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DriverDocument | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Hook para escutar mudanças em tempo real
  useRealtimeDocuments({
    onNewDocument: () => {
      console.log('Recarregando documentos devido a mudança em tempo real...');
      fetchDocuments();
    },
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        toast({
          title: 'Acesso Negado',
          description: 'Você não tem permissão para acessar esta área',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      fetchDocuments();
    } catch (error) {
      console.error('Erro ao verificar acesso admin:', error);
      navigate('/');
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_documents')
        .select(`
          id,
          document_type,
          file_name,
          file_path,
          file_type,
          is_verified,
          created_at,
          driver_profile_id,
          driver_profiles!inner(
            full_name,
            cpf
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDocs = data?.map((doc: any) => ({
        id: doc.id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_type: doc.file_type,
        is_verified: doc.is_verified,
        created_at: doc.created_at,
        driver_profile_id: doc.driver_profile_id,
        driver_name: doc.driver_profiles.full_name,
        driver_cpf: doc.driver_profiles.cpf,
      })) || [];

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar documentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc: DriverDocument) => {
    setSelectedDocument(doc);
    setViewerOpen(true);
  };

  const handleApproveDocument = async (documentId: string) => {
    try {
      setProcessingId(documentId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('driver_documents')
        .update({
          is_verified: true,
          verified_by: session?.user.id,
          verified_at: new Date().toISOString(),
          verification_notes: 'Documento aprovado',
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Documento aprovado com sucesso',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Erro ao aprovar documento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar documento',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDocument = async (documentId: string) => {
    try {
      setProcessingId(documentId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('driver_documents')
        .update({
          is_verified: false,
          verified_by: session?.user.id,
          verified_at: new Date().toISOString(),
          verification_notes: 'Documento rejeitado - verificar qualidade/validade',
        })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: 'Documento Rejeitado',
        description: 'Documento marcado como rejeitado',
      });

      fetchDocuments();
    } catch (error) {
      console.error('Erro ao rejeitar documento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar documento',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      cnh_frente: 'CNH - Frente',
      cnh_verso: 'CNH - Verso',
      crlv: 'CRLV',
      comprovante_residencia: 'Comprovante de Residência',
      foto_veiculo: 'Foto do Veículo',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (isVerified: boolean | null) => {
    if (isVerified === null) {
      return <Badge variant="outline">Pendente</Badge>;
    }
    if (isVerified) {
      return <Badge className="bg-green-500 text-white">Aprovado</Badge>;
    }
    return <Badge variant="destructive">Rejeitado</Badge>;
  };

  const pendingCount = documents.filter(d => d.is_verified === null).length;
  const approvedCount = documents.filter(d => d.is_verified === true).length;
  const rejectedCount = documents.filter(d => d.is_verified === false).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-24">
          <p className="text-center">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Revisão de Documentos</h1>
          <p className="text-muted-foreground">
            Revise e aprove documentos enviados pelos motoristas
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documentos Enviados</CardTitle>
            <CardDescription>
              Lista de todos os documentos enviados pelos motoristas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Tipo de Documento</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum documento encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.driver_name}</TableCell>
                      <TableCell>{doc.driver_cpf}</TableCell>
                      <TableCell>{getDocumentTypeLabel(doc.document_type)}</TableCell>
                      <TableCell>{formatDate(doc.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(doc.is_verified)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {doc.is_verified === null && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveDocument(doc.id)}
                              disabled={processingId === doc.id}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectDocument(doc.id)}
                              disabled={processingId === doc.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          onApprove={handleApproveDocument}
          onReject={handleRejectDocument}
        />
      )}
    </div>
  );
};

export default AdminDocuments;
