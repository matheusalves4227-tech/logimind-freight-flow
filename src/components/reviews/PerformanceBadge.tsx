import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PerformanceBadgeProps {
  entityId: string;
  type: "driver" | "carrier";
  showDetails?: boolean;
}

export const PerformanceBadge = ({
  entityId,
  type,
  showDetails = false,
}: PerformanceBadgeProps) => {
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, [entityId, type]);

  const fetchScore = async () => {
    try {
      const table = type === "driver" ? "driver_performance_scores" : "carrier_performance_scores";
      const idColumn = type === "driver" ? "driver_id" : "carrier_id";

      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .eq(idColumn, entityId)
        .maybeSingle();

      if (error) throw error;
      setScore(data);
    } catch (error) {
      console.error("Erro ao buscar score:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10 text-green-700 border-green-500/20";
    if (score >= 75) return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excelente";
    if (score >= 75) return "Muito Bom";
    if (score >= 60) return "Bom";
    return "Regular";
  };

  if (loading || !score) {
    return null;
  }

  const scoreValue = score.overall_score || 0;

  const detailsContent = (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span>Score Geral:</span>
        <span className="font-semibold">{scoreValue.toFixed(0)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Avaliações:</span>
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {score.average_rating?.toFixed(1) || 0} ({score.total_reviews || 0})
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span>Entregas no Prazo:</span>
        <span>{score.on_time_delivery_score?.toFixed(0) || 0}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Total de Entregas:</span>
        <span>{score.total_deliveries || 0}</span>
      </div>
    </div>
  );

  if (showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${getScoreColor(scoreValue)} cursor-help`}
            >
              <Award className="h-3 w-3 mr-1" />
              {getScoreLabel(scoreValue)} ({scoreValue.toFixed(0)})
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {detailsContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline" className={getScoreColor(scoreValue)}>
      <TrendingUp className="h-3 w-3 mr-1" />
      {scoreValue.toFixed(0)}
    </Badge>
  );
};
