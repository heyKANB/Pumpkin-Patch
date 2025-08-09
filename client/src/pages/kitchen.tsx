import { Link } from "wouter";
import { ArrowLeft, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Kitchen as KitchenComponent } from "@/components/kitchen";
import type { Player } from "@shared/schema";

export default function Kitchen() {
  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/player/default"],
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