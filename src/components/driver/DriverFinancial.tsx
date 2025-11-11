import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, CheckCircle, XCircle } from "lucide-react";
import { formatarMoeda } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DriverFinancialProps {
  driverProfile: any;
}

interface Payment {
  id: string;
  date: Date;
  amount: number;
  status: string;
  description: string;
}

interface Bid {
  id: string;
  date: Date;
  route: string;
  bid_amount: number;
  status: string;
  reason?: string;
}

export const DriverFinancial = ({ driverProfile }: DriverFinancialProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bidsHistory, setBidsHistory] = useState<Bid[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = () => {
    // Mock data - em produção, viria do banco de dados
    const mockPayments: Payment[] = [
      {
        id: "PAY-001",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        amount: 4950,
        status: "paid",
        description: "Frete São Paulo → Rio de Janeiro"
      },
      {
        id: "PAY-002",
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        amount: 2800,
        status: "paid",
        description: "Frete São Paulo → Curitiba"
      }
    ];

    const mockBids: Bid[] = [
      {
        id: "BID-001",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        route: "São Paulo/SP → Belo Horizonte/MG",
        bid_amount: 3200,
        status: "won",
      },
      {
        id: "BID-002",
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        route: "São Paulo/SP → Rio de Janeiro/RJ",
        bid_amount: 4950,
        status: "won",
      },
      {
        id: "BID-003",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        route: "São Paulo/SP → Campinas/SP",
        bid_amount: 1200,
        status: "lost",
        reason: "Lance mais alto que a concorrência"
      }
    ];

    setPayments(mockPayments);
    setBidsHistory(mockBids);
    setTotalEarnings(7750);
    setPendingBalance(4850);
  };

  const getBidStatusBadge = (status: string) => {
    if (status === "won") {
      return <Badge className="bg-green-600">Ganho</Badge>;
    } else if (status === "lost") {
      return <Badge variant="destructive">Perdido</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-600">Pago</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
        <p className="text-muted-foreground">Acompanhe seus ganhos e histórico de lances</p>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ganho
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatarMoeda(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo a Receber
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatarMoeda(pendingBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              3 entregas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximo Pagamento
            </CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Prazo estimado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Seus pagamentos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date.toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatarMoeda(payment.amount)}
                  </TableCell>
                  <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico de Lances */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lances</CardTitle>
          <CardDescription>Seus lances ganhos e perdidos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead>Valor do Lance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bidsHistory.map((bid) => (
                <TableRow key={bid.id}>
                  <TableCell>{bid.date.toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-sm">{bid.route}</TableCell>
                  <TableCell className="font-semibold">
                    {formatarMoeda(bid.bid_amount)}
                  </TableCell>
                  <TableCell>{getBidStatusBadge(bid.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {bid.status === "won" && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Lance aceito</span>
                      </div>
                    )}
                    {bid.status === "lost" && bid.reason && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <XCircle className="h-4 w-4" />
                        <span>{bid.reason}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
