import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, ChefHat, Plus, Coins } from 'lucide-react';
import type { Player, Oven } from '@shared/schema';

interface KitchenProps {
  player: Player;
}

export function Kitchen({ player }: KitchenProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ovens = [], isLoading } = useQuery<Oven[]>({
    queryKey: ['/api/player/default/ovens'],
  });

  const bakeMutation = useMutation({
    mutationFn: async (slotNumber: number) => {
      const response = await apiRequest('POST', '/api/bake', { playerId: 'default', slotNumber });
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
      queryClient.invalidateQueries({ queryKey: ['/api/player/default'] });
      queryClient.invalidateQueries({ queryKey: ['/api/player/default/ovens'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to expand kitchen", variant: "destructive" });
    },
  });

  const getOvenEmoji = (state: string) => {
    switch (state) {
      case "empty": return "🔥";
      case "baking": return "👨‍🍳";
      case "ready": return "🥧";
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
    
    const bakingTime = 30; // 30 minutes
    const startedAt = new Date(oven.startedAt);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60));
    const minutesRemaining = Math.max(0, bakingTime - minutesElapsed);
    
    if (minutesRemaining === 0) return "Ready!";
    return `${minutesRemaining}m remaining`;
  };

  const handleOvenClick = (oven: Oven) => {
    if (oven.state === "empty") {
      if (player.pumpkins < 1) {
        toast({ title: "Not enough pumpkins", description: "You need at least 1 pumpkin to bake a pie", variant: "destructive" });
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
          Turn your pumpkins into delicious pies! Each pie takes 30 minutes to bake.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Oven Slots Grid */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: player.kitchenSlots }, (_, index) => {
            const oven = ovens.find(o => o.slotNumber === index);
            if (!oven) return null;
            
            const emoji = getOvenEmoji(oven.state);
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
            <div className="font-semibold text-dark-brown dark:text-amber-100">Pumpkins Available</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{player.pumpkins}</div>
          </div>
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 border border-golden/30">
            <div className="font-semibold text-dark-brown dark:text-amber-100">Pies Made</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{player.pies}</div>
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
            <span>Click empty ovens to start baking (uses 1 pumpkin)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🥧</span>
            <span>Click ready pies to collect them</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <span>Sell pies in the marketplace for 40 coins each</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}