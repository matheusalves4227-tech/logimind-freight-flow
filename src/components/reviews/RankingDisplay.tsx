import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Trophy, TrendingUp, Award, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RankingItem {
  id: string;
  name: string;
  photoUrl?: string;
  overallScore: number;
  averageRating: number;
  totalReviews: number;
  totalDeliveries: number;
  reviewScore: number;
  onTimeScore: number;
  rank: number;
}

interface RankingDisplayProps {
  type: "driver" | "carrier";
  limit?: number;
}

export const RankingDisplay = ({ type, limit = 10 }: RankingDisplayProps) => {
  console.log("RankingDisplay rendered with type:", type, "limit:", limit);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingItem[]>([]);

  useEffect(() => {
    fetchRankings();
  }, [type, limit]);

  const fetchRankings = async () => {
    console.log("Fetching rankings for type:", type);
    try {
      if (type === "driver") {
        const { data: scores, error } = await supabase
          .from("driver_performance_scores")
          .select(`
            driver_id,
            overall_score,
            average_rating,
            total_reviews,
            total_deliveries,
            review_score,
            on_time_delivery_score,
            driver_profiles!inner(full_name, foto_perfil_url)
          `)
          .order("overall_score", { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formattedRankings: RankingItem[] = scores?.map((score: any, index: number) => ({
          id: score.driver_id,
          name: score.driver_profiles.full_name,
          photoUrl: score.driver_profiles.foto_perfil_url,
          overallScore: score.overall_score,
          averageRating: score.average_rating,
          totalReviews: score.total_reviews,
          totalDeliveries: score.total_deliveries,
          reviewScore: score.review_score,
          onTimeScore: score.on_time_delivery_score,
          rank: index + 1,
        })) || [];

        setRankings(formattedRankings);
      } else {
        const { data: scores, error } = await supabase
          .from("carrier_performance_scores")
          .select(`
            carrier_id,
            overall_score,
            average_rating,
            total_reviews,
            total_deliveries,
            review_score,
            on_time_delivery_score,
            carriers!inner(name, logo_url)
          `)
          .order("overall_score", { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formattedRankings: RankingItem[] = scores?.map((score: any, index: number) => ({
          id: score.carrier_id,
          name: score.carriers.name,
          photoUrl: score.carriers.logo_url,
          overallScore: score.overall_score,
          averageRating: score.average_rating,
          totalReviews: score.total_reviews,
          totalDeliveries: score.total_deliveries,
          reviewScore: score.review_score,
          onTimeScore: score.on_time_delivery_score,
          rank: index + 1,
        })) || [];

        setRankings(formattedRankings);
      }
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-5 w-5 text-slate-400" />;
    } else if (rank === 3) {
      return <Medal className="h-5 w-5 text-amber-600" />;
    }
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10 text-green-700 border-green-500/20";
    if (score >= 75) return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    if (score >= 60) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Ranking de {type === "driver" ? "Motoristas" : "Transportadoras"}
        </CardTitle>
        <CardDescription>
          Performance baseada em entregas, avaliações e KPIs da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankings.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                item.rank <= 3 ? "bg-accent/5" : "bg-card"
              }`}
            >
              <div className="flex items-center justify-center w-12">
                {getRankBadge(item.rank)}
              </div>

              <Avatar className="h-12 w-12">
                <AvatarImage src={item.photoUrl} alt={item.name} />
                <AvatarFallback className="bg-muted">
                  {item.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {item.averageRating.toFixed(1)} ({item.totalReviews} avaliações)
                  </span>
                  <span>{item.totalDeliveries} entregas</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${getScoreBadgeColor(item.overallScore)} font-semibold`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {item.overallScore.toFixed(0)}
                </Badge>
              </div>
            </div>
          ))}

          {rankings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum {type === "driver" ? "motorista" : "transportadora"} com avaliações ainda.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
