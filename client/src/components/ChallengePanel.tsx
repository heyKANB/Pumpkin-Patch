import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type SeasonalChallenge } from "@shared/schema";
import { 
  Trophy, 
  Target, 
  Clock, 
  Coins, 
  Sprout, 
  ChefHat, 
  TrendingUp, 
  Expand, 
  Calendar,
  Gift,
  Zap
} from "lucide-react";

interface ChallengePanelProps {
  playerId: string;
}

const CHALLENGE_ICONS = {
  harvest: Trophy,
  plant: Sprout,
  bake: ChefHat,
  earn: Coins,
  expand: Expand,
};

const DIFFICULTY_COLORS = {
  1: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
  3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  4: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  5: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function ChallengePanel({ playerId }: ChallengePanelProps) {
  const { toast } = useToast();

  const { data: challenges = [], isLoading } = useQuery<SeasonalChallenge[]>({
    queryKey: ["/api/player", playerId, "challenges"],
  });

  const generateChallengesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/challenges/generate", {
        playerId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "challenges"] });
      toast({
        title: "New Challenges! 🎯",
        description: data.message || "Fresh challenges are ready for you!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate challenges",
        variant: "destructive",
      });
    },
  });

  const activeChallenges = challenges.filter(c => c.status === "active");
  const completedChallenges = challenges.filter(c => c.status === "completed");

  const formatTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "No expiry";
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderRewards = (rewards: any) => {
    const rewardItems = [];
    if (rewards.coins) rewardItems.push(`${rewards.coins} coins`);
    if (rewards.seeds) rewardItems.push(`${rewards.seeds} seeds`);
    if (rewards.pumpkins) rewardItems.push(`${rewards.pumpkins} pumpkins`);
    if (rewards.apples) rewardItems.push(`${rewards.apples} apples`);
    if (rewards.fertilizer) rewardItems.push(`${rewards.fertilizer} fertilizer`);
    if (rewards.tools) rewardItems.push(`${rewards.tools} tools`);
    
    return rewardItems.join(", ");
  };

  const getDifficultyStars = (difficulty: number) => {
    return "⭐".repeat(difficulty);
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Target className="h-5 w-5" />
            Seasonal Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-amber-600" />
            <p className="text-amber-700 dark:text-amber-300">Loading challenges...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Target className="h-5 w-5" />
            Seasonal Challenges
            <Badge variant="secondary" className="ml-2">
              {activeChallenges.length} Active
            </Badge>
          </CardTitle>
          <Button
            onClick={() => generateChallengesMutation.mutate()}
            disabled={generateChallengesMutation.isPending}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Calendar className="h-4 w-4 mr-1" />
            {generateChallengesMutation.isPending ? "Generating..." : "New Daily"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeChallenges.length === 0 && completedChallenges.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              No challenges available. Generate your daily challenges!
            </p>
            <Button
              onClick={() => generateChallengesMutation.mutate()}
              disabled={generateChallengesMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Your Journey
            </Button>
          </div>
        ) : (
          <>
            {/* Active Challenges */}
            {activeChallenges.map((challenge) => {
              const IconComponent = CHALLENGE_ICONS[challenge.type] || Target;
              const progress = Math.min(100, (challenge.currentProgress / challenge.targetValue) * 100);
              const difficultyColor = DIFFICULTY_COLORS[challenge.difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS[1];
              
              return (
                <Card key={challenge.id} className="bg-white/80 dark:bg-gray-800/80 border-amber-200 dark:border-amber-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                          <IconComponent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {challenge.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={difficultyColor}>
                          {getDifficultyStars(challenge.difficulty)}
                        </Badge>
                        {challenge.expiresAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeRemaining(challenge.expiresAt.toString())}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {challenge.currentProgress} / {challenge.targetValue}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Gift className="h-4 w-4" />
                        {renderRewards(challenge.rewards)}
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        {challenge.season}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Completed Challenges */}
            {completedChallenges.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Recently Completed ({completedChallenges.length})
                </h3>
                <div className="space-y-2">
                  {completedChallenges.slice(0, 3).map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          {challenge.title}
                        </span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✓ Complete
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}