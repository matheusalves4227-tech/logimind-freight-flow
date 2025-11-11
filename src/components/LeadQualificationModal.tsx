import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar, Package } from "lucide-react";

interface LeadQualificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadQualificationModal = ({ open, onOpenChange }: LeadQualificationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    monthlyVolume: "",
    segment: "",
    challenge: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call - In production, this would send to your CRM/backend
    setTimeout(() => {
      toast.success(
        "Obrigado! Nossa equipe entrará em contato em até 24 horas.",
        {
          description: "Você receberá um email de confirmação em breve.",
        }
      );
      setLoading(false);
      onOpenChange(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        monthlyVolume: "",
        segment: "",
        challenge: "",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Fale com um Especialista LogiMind</DialogTitle>
          <DialogDescription className="text-base">
            Preencha o formulário abaixo e nossa equipe entrará em contato para entender suas
            necessidades e apresentar a melhor solução logística.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone/WhatsApp *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                placeholder="Nome da empresa"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyVolume">Volume Mensal de Fretes *</Label>
            <Select
              value={formData.monthlyVolume}
              onValueChange={(value) => setFormData({ ...formData, monthlyVolume: value })}
              required
            >
              <SelectTrigger id="monthlyVolume">
                <SelectValue placeholder="Selecione o volume aproximado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1 a 10 fretes/mês</SelectItem>
                <SelectItem value="11-50">11 a 50 fretes/mês</SelectItem>
                <SelectItem value="51-100">51 a 100 fretes/mês</SelectItem>
                <SelectItem value="101-500">101 a 500 fretes/mês</SelectItem>
                <SelectItem value="500+">Mais de 500 fretes/mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment">Segmento de Atuação *</Label>
            <Select
              value={formData.segment}
              onValueChange={(value) => setFormData({ ...formData, segment: value })}
              required
            >
              <SelectTrigger id="segment">
                <SelectValue placeholder="Selecione seu segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="e-commerce">E-commerce / Varejo Online</SelectItem>
                <SelectItem value="industria">Indústria / Manufatura</SelectItem>
                <SelectItem value="distribuicao">Distribuição / Atacado</SelectItem>
                <SelectItem value="construcao">Construção Civil</SelectItem>
                <SelectItem value="agricultura">Agricultura / Agronegócio</SelectItem>
                <SelectItem value="farmaceutico">Farmacêutico / Saúde</SelectItem>
                <SelectItem value="alimentos">Alimentos e Bebidas</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenge">Principal Desafio Logístico</Label>
            <Textarea
              id="challenge"
              placeholder="Ex: Altos custos de frete, dificuldade em encontrar transportadoras confiáveis, atrasos frequentes..."
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Análise Personalizada:</strong> Nossa equipe
                irá analisar suas necessidades e preparar uma demonstração focada no seu segmento.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Resposta em 24h:</strong> Um especialista
                entrará em contato para agendar uma reunião no melhor horário para você.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitação"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadQualificationModal;
