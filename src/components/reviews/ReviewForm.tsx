import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReviewFormProps {
  orderId: string;
  driverId?: string;
  carrierId?: string;
  type: "driver" | "carrier";
  onSuccess?: () => void;
}

interface RatingCategory {
  key: string;
  label: string;
  value: number;
}

export const ReviewForm = ({ orderId, driverId, carrierId, type, onSuccess }: ReviewFormProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState("");

  const driverCategories: RatingCategory[] = [
    { key: "punctuality_rating", label: "Pontualidade", value: 0 },
    { key: "professionalism_rating", label: "Profissionalismo", value: 0 },
    { key: "vehicle_condition_rating", label: "Condição do Veículo", value: 0 },
    { key: "communication_rating", label: "Comunicação", value: 0 },
  ];

  const carrierCategories: RatingCategory[] = [
    { key: "service_quality_rating", label: "Qualidade do Serviço", value: 0 },
    { key: "delivery_time_rating", label: "Prazo de Entrega", value: 0 },
    { key: "price_rating", label: "Custo-Benefício", value: 0 },
    { key: "support_rating", label: "Suporte", value: 0 },
  ];

  const [categories, setCategories] = useState<RatingCategory[]>(
    type === "driver" ? driverCategories : carrierCategories
  );

  const handleCategoryRating = (categoryKey: string, rating: number) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.key === categoryKey ? { ...cat, value: rating } : cat
      )
    );
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: "Avaliação obrigatória",
        description: "Por favor, dê uma avaliação geral.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const reviewData: any = {
        order_id: orderId,
        reviewer_user_id: user.id,
        rating: overallRating,
        comment: comment.trim() || null,
      };

      // Adicionar ratings de categorias
      categories.forEach(cat => {
        if (cat.value > 0) {
          reviewData[cat.key] = cat.value;
        }
      });

      if (type === "driver" && driverId) {
        reviewData.driver_id = driverId;
        const { error } = await supabase.from("driver_reviews").insert(reviewData);
        if (error) throw error;

        // Recalcular score do motorista
        await supabase.functions.invoke("calculate-performance-scores", {
          body: { type: "driver", entityId: driverId },
        });
      } else if (type === "carrier" && carrierId) {
        reviewData.carrier_id = carrierId;
        const { error } = await supabase.from("carrier_reviews").insert(reviewData);
        if (error) throw error;

        // Recalcular score da transportadora
        await supabase.functions.invoke("calculate-performance-scores", {
          body: { type: "carrier", entityId: carrierId },
        });
      }

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback.",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar avaliação:", error);
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliar {type === "driver" ? "Motorista" : "Transportadora"}</CardTitle>
        <CardDescription>
          Sua avaliação ajuda a melhorar a qualidade do serviço
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Avaliação Geral *</Label>
          <StarRating value={overallRating} onChange={setOverallRating} />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm text-muted-foreground">
            Avaliações Detalhadas (Opcional)
          </Label>
          {categories.map((category) => (
            <div key={category.key} className="space-y-2">
              <Label className="text-sm">{category.label}</Label>
              <StarRating
                value={category.value}
                onChange={(v) => handleCategoryRating(category.key, v)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="comment">Comentário (Opcional)</Label>
          <Textarea
            id="comment"
            placeholder="Compartilhe sua experiência..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {comment.length}/500 caracteres
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || overallRating === 0}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Avaliação"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
