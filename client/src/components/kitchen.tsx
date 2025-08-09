import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, ChefHat, Plus, Coins } from 'lucide-react';
import type { Player, Oven } from '@shared/schema';
import { useState } from 'react';

interface KitchenProps {
  player: Player;
}

export function Kitchen({ player }: KitchenProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPieType, setSelectedPieType] = useState<"pumpkin" | "apple">("pumpkin");

  const { data: ovens = [], isLoading } = useQuery<Oven[]>({
    queryKey: ['/api/player/default/ovens'],
  });

  const bakeMutation = useMutation({
    mutationFn: async (slotNumber: number) => {
      const response = await apiRequest('POST', '/api/bake', { playerId: 'default', slotNumber, pieType: selectedPieType });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Success", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/player/default'] });
      queryClient.invalidateQueries({ queryKey: ['/api/player/default/ovens'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start baking", variant: "destructive" });
    },
  });

  const collectMutation = useMutation({
    mutationFn: async (slotNumber: number) => {
      const response = await apiRequest('POST', '/api/collect-pie', { playerId: 'default', slotNumber });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Success", description: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/player/default'] });
      queryClient.invalidateQueries({ queryKey: ['/api/player/default/ovens'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to collect pie", variant: "destructive" });
    },
  });

  const expandMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/expand-kitchen', { playerId: 'default' });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Success", description: data.message });
      // Force refetch all player-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
      queryClient.refetchQueries({ queryKey: ['/api/player/default'] });
      queryClient.refetchQueries({ queryKey: ['/api/player/default/ovens'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to expand kitchen", variant: "destructive" });
    },
  });

  const getOvenEmoji = (state: string, pieType?: string) => {
    switch (state) {
      case "empty": return "🔥";
      case "baking": return "👨‍🍳";
      case "ready": return pieType === "apple" ? "🍎🥧" : "🥧";
      default: return "🔥";
    }
  };

  const getOvenStyles = (state: string) => {
    switch (state) {
      case "empty": 
        return "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 hover:from-orange-100 hover:to-orange-200 hover:border-orange-300 cursor-pointer";
      case "baking": 
        return "bg-gradient-to-br from-orange-200 to-red-300 border-orange-400 animate-pulse";
      case "ready": 
        return "bg-gradient-to-br from-yellow-200 to-amber-300 border-golden hover:from-yellow-300 hover:to-amber-400 cursor-pointer animate-bounce-gentle";
      default: 
        return "bg-gray-100 border-gray-300";
    }
  };

  const getTimeRemaining = (oven: Oven) => {
    if (oven.state !== "baking" || !oven.startedAt) return null;
    
    const bakingTime = oven.pieType === "apple" ? 15 : 30; // Apple pies 15min, pumpkin pies 30min
    const startedAt = new Date(oven.startedAt);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
    const minutesRemaining = Math.max(0, bakingTime - minutesElapsed);
    
    if (minutesRemaining === 0) return "Ready!";
    return `${minutesRemaining}m remaining`;
  };

  const handleOvenClick = (oven: Oven) => {
    if (oven.state === "empty") {
      const ingredient = selectedPieType === "apple" ? "apples" : "pumpkins";
      const ingredientCount = selectedPieType === "apple" ? player.apples : player.pumpkins;
      
      if (ingredientCount < 1) {
        toast({ 
          title: `Not enough ${ingredient}`, 
          description: `You need at least 1 ${ingredient.slice(0, -1)} to bake a pie`, 
          variant: "destructive" 
        });
        return;
      }
      bakeMutation.mutate(oven.slotNumber);
    } else if (oven.state === "ready") {
      collectMutation.mutate(oven.slotNumber);
    }
  };

  const getKitchenExpansionCost = () => {
    if (player.kitchenSlots >= 5) return null;
    return Math.pow(2, player.kitchenSlots - 1) * 100;
  };

  const expansionCost = getKitchenExpansionCost();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-warm-brown to-rich-brown border-2 border-golden shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cream">
            <ChefHat className="h-6 w-6" />
            Kitchen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-cream">Loading kitchen...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-warm-brown to-rich-brown border-2 border-golden shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cream">
          <ChefHat className="h-6 w-6" />
          Kitchen ({player.kitchenSlots}/5 slots)
        </CardTitle>
        <CardDescription className="text-cream/80">
          Turn your crops into delicious pies! Pumpkin pies take 30 minutes, apple pies take 15 minutes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pie Type Selection */}
        <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl p-4 border-2 border-amber-800/50">
          <h3 className="font-bold text-dark-brown mb-3 flex items-center gap-2">
            <span className="text-xl">👨‍🍳</span>
            Select Pie Type to Bake
          </h3>
          <div className="flex gap-3">
            <Button
              onClick={() => setSelectedPieType("pumpkin")}
              className={`flex items-center gap-2 ${
                selectedPieType === "pumpkin" 
                  ? "bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-800" 
                  : "bg-white hover:bg-orange-50 text-dark-brown border-2 border-orange-300"
              }`}
              disabled={player.pumpkins === 0}
            >
              <span className="text-lg">🥧</span>
              <div className="text-left">
                <div className="font-semibold">Pumpkin Pies</div>
                <div className="text-xs opacity-80">30min bake • 40 coins • Have: {player.pumpkins}</div>
              </div>
            </Button>
            
            <Button
              onClick={() => setSelectedPieType("apple")}
              className={`flex items-center gap-2 ${
                selectedPieType === "apple" 
                  ? "bg-red-600 hover:bg-red-700 text-white border-2 border-red-800" 
                  : "bg-white hover:bg-red-50 text-dark-brown border-2 border-red-300"
              }`}
              disabled={player.apples === 0}
            >
              <span className="text-lg">🍎🥧</span>
              <div className="text-left">
                <div className="font-semibold">Apple Pies</div>
                <div className="text-xs opacity-80">15min bake • 25 coins • Have: {player.apples}</div>
              </div>
            </Button>
          </div>
          <div className="mt-3 text-sm text-dark-brown/70">
            Selected: <span className="font-semibold text-dark-brown">
              {selectedPieType === "apple" ? "🍎🥧 Apple Pie" : "🥧 Pumpkin Pie"} 
            </span> - Click empty ovens to start baking
          </div>
        </div>

        {/* Oven Slots Grid */}

        
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: player.kitchenSlots }, (_, index) => {
            const oven = ovens.find(o => o.slotNumber === index);
            if (!oven) {
              // Fallback for missing oven slot - should not happen normally
              return (
                <div
                  key={index}
                  className="aspect-square rounded-lg border-2 shadow-lg bg-red-100 border-red-300 flex flex-col items-center justify-center"
                >
                  <span className="text-2xl">❌</span>
                  <div className="text-xs text-red-600">Missing slot {index}</div>
                </div>
              );
            }
            
            const emoji = getOvenEmoji(oven.state, oven.pieType || undefined);
            const styles = getOvenStyles(oven.state);
            const timeRemaining = getTimeRemaining(oven);
            
            return (
              <div
                key={index}
                className={`aspect-square rounded-lg border-2 shadow-lg transition-all duration-200 flex flex-col items-center justify-center relative ${styles}`}
                onClick={() => handleOvenClick(oven)}
              >
                <span className="text-2xl">{emoji}</span>
                {timeRemaining && (
                  <div className="absolute bottom-1 text-xs font-semibold text-center px-1">
                    {timeRemaining}
                  </div>
                )}
                {oven.state === "baking" && (
                  <div className="absolute top-1 right-1">
                    <Clock className="h-3 w-3 text-orange-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator className="bg-golden/30" />

        {/* Kitchen Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 border border-golden/30">
            <div className="font-semibold text-dark-brown dark:text-amber-100">Ingredients</div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              🎃 {player.pumpkins} pumpkins<br/>
              🍎 {player.apples} apples
            </div>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 border border-golden/30">
            <div className="font-semibold text-dark-brown dark:text-amber-100">Pies Made</div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              🥧 {player.pies} pumpkin pies<br/>
              🍎🥧 {player.applePies} apple pies
            </div>
          </div>
        </div>

        {/* Kitchen Expansion */}
        {expansionCost && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg border-2 border-golden/30">
            <h3 className="font-semibold text-dark-brown dark:text-amber-100 mb-2">Expand Kitchen</h3>
            <p className="text-sm text-dark-brown/80 dark:text-amber-100/80 mb-3">
              Add another oven slot to bake more pies simultaneously!
            </p>
            <Button
              onClick={() => expandMutation.mutate()}
              disabled={expandMutation.isPending || player.coins < expansionCost}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              <Coins className="h-4 w-4 mr-1" />
              {expansionCost} coins
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-cream/60 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span>Select pie type above, then click empty ovens to start baking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🥧</span>
            <span>Click ready pies to collect them</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span>Sell pumpkin pies (40 coins) or apple pies (25 coins) in marketplace</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}