import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Award, 
  Medal,
  Crown,
  Truck,
  Target,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

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
  evolution?: "up" | "down" | "stable";
}

interface RankingDisplayProps {
  type: "driver" | "carrier";
  limit?: number;
  currentUserId?: string;
}

export const RankingDisplay = ({ type, limit = 10, currentUserId }: RankingDisplayProps) => {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [myRanking, setMyRanking] = useState<RankingItem | null>(null);

  useEffect(() => {
    fetchRankings();
  }, [type, limit]);

  const fetchRankings = async () => {
    setLoading(true);
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
            driver_profiles!inner(full_name, foto_perfil_url, user_id)
          `)
          .order("overall_score", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Error fetching driver rankings:", error);
          throw error;
        }

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
          evolution: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
        })) || [];

        setRankings(formattedRankings);
        
        // Find current user ranking
        if (currentUserId) {
          const myRank = formattedRankings.find(r => r.id === currentUserId);
          if (myRank) setMyRanking(myRank);
        }
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

        if (error) {
          console.error("Error fetching carrier rankings:", error);
          throw error;
        }

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
          evolution: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
        })) || [];

        setRankings(formattedRankings);
      }
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEvolutionIcon = (evolution?: string) => {
    switch (evolution) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    if (score >= 75) return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    if (score >= 60) return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  // Get top 3 for podium
  const top3 = rankings.slice(0, 3);
  const restRankings = rankings.slice(3);

  // Calculate progress to next level
  const nextLevelPoints = myRanking ? Math.ceil(myRanking.overallScore / 10) * 10 + 10 : 100;
  const progressToNext = myRanking ? ((myRanking.overallScore % 10) / 10) * 100 : 0;

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
    <TooltipProvider>
      <div className="space-y-6">
        {/* My Performance Card */}
        {myRanking && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-accent/5 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Sua Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold text-primary">#{myRanking.rank}</p>
                  <p className="text-xs text-muted-foreground">Posição Atual</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold text-emerald-600">{myRanking.overallScore.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Pontos Totais</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <p className="text-2xl font-bold text-amber-500">{myRanking.totalDeliveries}</p>
                  <p className="text-xs text-muted-foreground">Entregas</p>
                </div>
                <div className="col-span-2 md:col-span-1 p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground">Próximo Nível</p>
                  </div>
                  <Progress value={progressToNext} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    Faltam {(nextLevelPoints - myRanking.overallScore).toFixed(0)} pts para frete premium
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Epic Podium - Top 3 */}
        {top3.length >= 3 && (
          <div className="relative py-8 animate-fade-in">
            <div className="flex items-end justify-center gap-4 md:gap-8">
              {/* 2nd Place - Left */}
              <div 
                className="flex flex-col items-center animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full blur-sm opacity-50" />
                  <Avatar className="h-16 w-16 md:h-20 md:w-20 relative ring-4 ring-slate-300 shadow-lg">
                    <AvatarImage src={top3[1]?.photoUrl} alt={top3[1]?.name} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-lg font-bold">
                      {top3[1]?.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-3 text-center">
                  <Medal className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <p className="font-semibold text-sm truncate max-w-[100px]">{top3[1]?.name}</p>
                  <p className="text-xs text-muted-foreground">{top3[1]?.overallScore.toFixed(0)} pts</p>
                  <p className="text-xs text-muted-foreground">{top3[1]?.totalDeliveries} entregas</p>
                </div>
                <div className="w-24 md:w-32 h-20 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg mt-3 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-bold text-slate-500">2</span>
                </div>
              </div>

              {/* 1st Place - Center (Highest) */}
              <div 
                className="flex flex-col items-center -mt-6 animate-fade-in"
                style={{ animationDelay: "0s" }}
              >
                <div className="relative">
                  {/* Floating Crown */}
                  <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500 animate-bounce" style={{ animationDuration: "2s" }} />
                  {/* Gold Glow */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full blur-md opacity-60" />
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 relative ring-4 ring-yellow-400 shadow-xl">
                    <AvatarImage src={top3[0]?.photoUrl} alt={top3[0]?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-100 to-amber-100 text-amber-700 text-xl font-bold">
                      {top3[0]?.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-3 text-center">
                  <Trophy className="h-7 w-7 text-yellow-500 mx-auto mb-1" />
                  <p className="font-bold text-base truncate max-w-[120px]">{top3[0]?.name}</p>
                  <p className="text-sm font-semibold text-amber-600">{top3[0]?.overallScore.toFixed(0)} pts</p>
                  <p className="text-xs text-muted-foreground">{top3[0]?.totalDeliveries} entregas</p>
                </div>
                <div className="w-28 md:w-36 h-28 bg-gradient-to-t from-amber-400 via-yellow-300 to-yellow-200 rounded-t-lg mt-3 flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-amber-700">1</span>
                </div>
              </div>

              {/* 3rd Place - Right */}
              <div 
                className="flex flex-col items-center animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full blur-sm opacity-50" />
                  <Avatar className="h-16 w-16 md:h-20 md:w-20 relative ring-4 ring-amber-600 shadow-lg">
                    <AvatarImage src={top3[2]?.photoUrl} alt={top3[2]?.name} />
                    <AvatarFallback className="bg-amber-50 text-amber-700 text-lg font-bold">
                      {top3[2]?.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-3 text-center">
                  <Medal className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                  <p className="font-semibold text-sm truncate max-w-[100px]">{top3[2]?.name}</p>
                  <p className="text-xs text-muted-foreground">{top3[2]?.overallScore.toFixed(0)} pts</p>
                  <p className="text-xs text-muted-foreground">{top3[2]?.totalDeliveries} entregas</p>
                </div>
                <div className="w-24 md:w-32 h-16 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-lg mt-3 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-bold text-amber-700">3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Table */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Classificação Geral
            </CardTitle>
            <CardDescription>
              {type === "driver" ? "Motoristas" : "Transportadoras"} ordenados por performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Table Header with Icon Tooltips */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 rounded-lg mb-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-1">
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <TrendingUp className="h-4 w-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Evolução</TooltipContent>
                </Tooltip>
              </div>
              <div className="col-span-4">Nome</div>
              <div className="col-span-2 text-center">
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <Star className="h-4 w-4 mx-auto fill-amber-400 text-amber-400" />
                  </TooltipTrigger>
                  <TooltipContent>Avaliação Média</TooltipContent>
                </Tooltip>
              </div>
              <div className="col-span-2 text-center">
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <Truck className="h-4 w-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Total de Entregas</TooltipContent>
                </Tooltip>
              </div>
              <div className="col-span-2 text-center">
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    <Target className="h-4 w-4 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>Score Total</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Ranking Rows with Cascade Animation */}
            <div className="space-y-2">
              {restRankings.map((item, index) => {
                const isCurrentUser = currentUserId && item.id === currentUserId;
                
                return (
                  <div
                    key={item.id}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all hover:shadow-md animate-fade-in ${
                      isCurrentUser 
                        ? "bg-blue-50 border-l-4 border-l-primary border-blue-200" 
                        : "bg-card hover:bg-accent/5"
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center">
                      <span className="text-sm font-bold text-muted-foreground">#{item.rank}</span>
                    </div>

                    {/* Evolution */}
                    <div className="col-span-1 flex justify-center">
                      {getEvolutionIcon(item.evolution)}
                    </div>

                    {/* Avatar & Name */}
                    <div className="col-span-4 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.photoUrl} alt={item.name} />
                        <AvatarFallback className="bg-muted text-xs">
                          {item.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                            Você
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="col-span-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{item.averageRating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">({item.totalReviews})</span>
                    </div>

                    {/* Deliveries */}
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-medium">{item.totalDeliveries}</span>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 text-center">
                      <Badge
                        variant="outline"
                        className={`${getScoreBadgeColor(item.overallScore)} font-semibold text-xs`}
                      >
                        {item.overallScore.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {rankings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhum {type === "driver" ? "motorista" : "transportadora"} com avaliações ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
