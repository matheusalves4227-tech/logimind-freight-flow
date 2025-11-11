import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Order {
  id: string;
  quote_id: string;
  status: "in_transit" | "scheduled" | "delivered" | "incident";
  carrier_name: string;
  carrier_type: "carrier" | "autonomous";
  vehicle_type?: string;
  origin_city: string;
  destination_city: string;
  final_price: number;
  estimated_delivery: string;
  created_at: string;
}

interface ActiveOrdersTableProps {
  orders: Order[];
  onViewDetails: (orderId: string) => void;
}

const statusConfig = {
  in_transit: { label: "Em Trânsito", color: "bg-primary text-primary-foreground" },
  scheduled: { label: "Coleta Agendada", color: "bg-accent text-accent-foreground" },
  delivered: { label: "Entregue", color: "bg-secondary text-secondary-foreground" },
  incident: { label: "Ocorrência", color: "bg-destructive text-destructive-foreground" },
};

export const ActiveOrdersTable = ({ orders, onViewDetails }: ActiveOrdersTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.origin_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.destination_city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const isNearDeadline = (date: string) => {
    const delivery = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 2 && daysUntil >= 0;
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Pedidos Ativos</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, transportadora ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todos os Status</option>
            <option value="in_transit">Em Trânsito</option>
            <option value="scheduled">Coleta Agendada</option>
            <option value="delivered">Entregue</option>
            <option value="incident">Ocorrência</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID do Frete</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transportador</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Preço Final</TableHead>
              <TableHead>Previsão de Entrega</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum pedido encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[order.status].color}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.carrier_name}</p>
                      {order.carrier_type === "autonomous" && order.vehicle_type && (
                        <p className="text-xs text-muted-foreground">
                          Autônomo - {order.vehicle_type}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{order.origin_city}</p>
                      <p className="text-muted-foreground">→ {order.destination_city}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    R$ {order.final_price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={isNearDeadline(order.estimated_delivery) ? "text-accent font-medium" : ""}>
                      {new Date(order.estimated_delivery).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(order.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
