import { Link } from "wouter";
import { ArrowLeft, ChefHat, Lock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Kitchen as KitchenComponent } from "@/components/kitchen";
import { useToast } from "@/hooks/use-toast";
import type { Player } from "@shared/schema";

export default function Kitchen() {
  const { toast } = useToast();
  
  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/player/default"],
  });

  const unlockKitchenMutation = useMutation({
    mutationFn: () => apiRequest("/api/unlock-kitchen", "POST", { playerId: "default" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/default"] });
      toast({
        title: "Kitchen Unlocked!",
        description: data.message,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unlock kitchen",
        description: error.message || "Not enough coins",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-orange-600 dark:text-orange-400">Loading kitchen...</p>
        </div>
      </div>
    );
  }

  // Show unlock screen if kitchen is not unlocked
  if (player && player.kitchenUnlocked === 0) {
    const unlockCost = 250;
    const canAfford = player.coins >= unlockCost;

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-orange-200 dark:border-orange-700">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Map
                </Button>
              </Link>
              <div className="h-6 w-px bg-orange-200 dark:bg-orange-700"></div>
              <h1 className="text-xl font-semibold text-orange-800 dark:text-orange-200 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Kitchen (Locked)
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-yellow-600 dark:text-yellow-400">
                💰 {player.coins}
              </div>
            </div>
          </div>
        </div>

        {/* Unlock content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold text-orange-800 dark:text-orange-200 mb-2">
                Kitchen Locked
              </h2>
              <p className="text-lg text-orange-600 dark:text-orange-300 mb-6">
                Unlock your kitchen to start baking delicious pies from your crops!
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-3">
                Kitchen Features:
              </h3>
              <ul className="text-left max-w-md mx-auto space-y-2 text-orange-700 dark:text-orange-300">
                <li className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Bake pumpkins into valuable pies (40 coins each)
                </li>
                <li className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Bake apples into apple pies (25 coins each)
                </li>
                <li className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Expand with more oven slots for batch cooking
                </li>
                <li className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-2" />
                  Turn raw crops into premium products
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                Unlock Cost: {unlockCost} coins
              </div>
              <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>

            {canAfford ? (
              <Button 
                onClick={() => unlockKitchenMutation.mutate()}
                disabled={unlockKitchenMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
              >
                {unlockKitchenMutation.isPending ? (
                  "Unlocking..."
                ) : (
                  `Unlock Kitchen for ${unlockCost} coins`
                )}
              </Button>
            ) : (
              <div>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  You need {unlockCost - player.coins} more coins to unlock the kitchen
                </p>
                <Link href="/marketplace">
                  <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                    Go to Marketplace to Earn Coins
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950">
      {/* Header with navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-orange-200 dark:border-orange-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Map
              </Button>
            </Link>
            <div className="h-6 w-px bg-orange-200 dark:bg-orange-700"></div>
            <h1 className="text-xl font-semibold text-orange-800 dark:text-orange-200 flex items-center">
              <ChefHat className="w-5 h-5 mr-2" />
              Kitchen
            </h1>
          </div>
          
          {/* Player stats */}
          {player && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-yellow-600 dark:text-yellow-400">
                💰 {player.coins}
              </div>
              <div className="text-orange-600 dark:text-orange-400">
                🎃 {player.pumpkins}
              </div>
              <div className="text-red-600 dark:text-red-400">
                🍎 {player.apples}
              </div>
              <div className="text-amber-600 dark:text-amber-400">
                🥧 {player.pies}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kitchen content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-orange-800 dark:text-orange-200 mb-2">
            Welcome to Your Kitchen!
          </h2>
          <p className="text-lg text-orange-600 dark:text-orange-300">
            Transform your harvested crops into delicious pies
          </p>
        </div>

        {/* Kitchen component */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-orange-200 dark:border-orange-700">
          {player && <KitchenComponent player={player} />}
        </div>
      </div>
    </div>
  );
}