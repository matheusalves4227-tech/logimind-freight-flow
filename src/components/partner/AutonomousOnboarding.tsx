import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Truck, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface AutonomousOnboardingProps {
  cpf: string;
  onBack: () => void;
}

const AutonomousOnboarding = ({ cpf, onBack }: AutonomousOnboardingProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    whatsapp: "",
    cnh_numero: "",
    cnh_categoria: "",
    rntrc: "",
    veiculo_tipo: "",
    veiculo_placa: "",
    veiculo_capacidade_kg: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast.success("Cadastro recebido! Você receberá um e-mail com próximos passos.");
    setTimeout(() => navigate("/motorista/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Seleção
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-4">
              <Truck className="h-5 w-5 text-accent" />
              <span className="text-accent font-semibold">Motorista Autônomo</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Cadastro de Motorista
            </h1>
            <p className="text-muted-foreground">
              CPF: {cpf}
            </p>
          </div>

          <Card className="p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    1
                  </span>
                  Dados Pessoais
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(11) 98888-7777"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(11) 98888-7777"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    2
                  </span>
                  Documentação Legal
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnh_numero">Número da CNH *</Label>
                    <Input
                      id="cnh_numero"
                      value={formData.cnh_numero}
                      onChange={(e) => setFormData({ ...formData, cnh_numero: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnh_categoria">Categoria da CNH *</Label>
                    <Select
                      value={formData.cnh_categoria}
                      onValueChange={(value) => setFormData({ ...formData, cnh_categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="rntrc">RNTRC (Registro Nacional) *</Label>
                    <Input
                      id="rntrc"
                      value={formData.rntrc}
                      onChange={(e) => setFormData({ ...formData, rntrc: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-900 dark:text-amber-100">
                      <p className="font-medium mb-1">Documentos Obrigatórios</p>
                      <p className="text-xs">
                        CNH válida e RNTRC ativo são essenciais para legalidade do transporte.
                        Você fará upload após o cadastro inicial.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                    3
                  </span>
                  Dados do Veículo
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="veiculo_tipo">Tipo de Veículo *</Label>
                    <Select
                      value={formData.veiculo_tipo}
                      onValueChange={(value) => setFormData({ ...formData, veiculo_tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moto">Moto</SelectItem>
                        <SelectItem value="carro">Carro Baú</SelectItem>
                        <SelectItem value="picape">Picape</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="caminhao_toco">Caminhão Toco</SelectItem>
                        <SelectItem value="caminhao_truck">Caminhão Truck</SelectItem>
                        <SelectItem value="carreta">Carreta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="veiculo_placa">Placa do Veículo *</Label>
                    <Input
                      id="veiculo_placa"
                      placeholder="ABC-1D23"
                      value={formData.veiculo_placa}
                      onChange={(e) => setFormData({ ...formData, veiculo_placa: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="veiculo_capacidade_kg">Capacidade (kg) *</Label>
                    <Input
                      id="veiculo_capacidade_kg"
                      type="number"
                      placeholder="1000"
                      value={formData.veiculo_capacidade_kg}
                      onChange={(e) => setFormData({ ...formData, veiculo_capacidade_kg: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-4 bg-accent/5 rounded-lg mb-4">
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-accent mb-1">
                      Próximos Passos
                    </p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Upload de documentos (CNH, RNTRC, CRLV)</li>
                      <li>• Validação em até 48h pela equipe LogiMarket</li>
                      <li>• Download do App para receber oportunidades</li>
                      <li>• Configuração de dados bancários para repasse</li>
                    </ul>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Criar Minha Conta de Motorista
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutonomousOnboarding;
