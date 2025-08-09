import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Player, type Plot } from "@shared/schema";
import { Coins, Sprout, ShoppingCart, DollarSign, Expand, Save, Settings, Plus, Clock, MapPin, TrendingUp, Store, ChefHat, Target } from "lucide-react";
import { Kitchen } from "@/components/kitchen";
import { ChallengePanel } from "@/components/ChallengePanel";
import { HeaderAd, FooterAd } from "@/components/AdBanner";
import { RewardedAdButton } from "@/components/RewardedAdButton";
import { useState } from "react";

const PLAYER_ID = "default";

export default function Game() {
  const { toast } = useToast();
  const [showKitchen, setShowKitchen] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [selectedCropType, setSelectedCropType] = useState<"pumpkin" | "apple">("pumpkin");

  // Challenge progress helper
  const updateChallengeProgress = async (challengeId: string, progress: number) => {
    try {
      await apiRequest("POST", "/api/challenge/progress", {
        playerId: PLAYER_ID,
        challengeId,
        progress
      });
      queryClient.invalidateQueries({ queryKey: ["/api/player", PLAYER_ID, "challenges"] });
    } catch (error) {
      console.log("Challenge progress update failed:", error);
    }
  };

  // Queries
  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ["/api/player", PLAYER_ID],
  });

  const { data: plots, isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/player", PLAYER_ID, "plots"],
  });

  // Mutations
  const plantMutation = useMutation({
    mutationFn: async ({ row, col, cropType = "pumpkin" }: { row: number; col: number; cropType?: string }) => {
      const response = await apiRequest("POST", "/api/plant", {
        playerId: PLAYER_ID,
        row,
        col,
        cropType: cropType || "pumpkin",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      
      const growthTime = selectedCropType === "apple" ? "15 minutes" : "60 minutes";
      const cropName = selectedCropType === "apple" ? "apple tree" : "pumpkin";
      toast({
        title: "Seed Planted! 🌱",
        description: data.message || `Your ${cropName} will mature in ${growthTime}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to plant seed",
        variant: "destructive",
      });
    },
  });

  const harvestMutation = useMutation({
    mutationFn: async ({ row, col }: { row: number; col: number }) => {
      const response = await apiRequest("POST", "/api/harvest", {
        playerId: PLAYER_ID,
        row,
        col,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      
      toast({
        title: "Harvest Complete! 🎃🍎",
        description: data.message || "Added crop to inventory",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to harvest pumpkin",
        variant: "destructive",
      });
    },
  });

  const fertilizeMutation = useMutation({
    mutationFn: async ({ row, col }: { row: number; col: number }) => {
      const response = await apiRequest("POST", "/api/fertilize", {
        playerId: PLAYER_ID,
        row,
        col,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Fertilizer Applied! ⚡",
        description: data.message || "Growth speed doubled!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply fertilizer",
        variant: "destructive",
      });
    },
  });

  const buyMutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: "seeds"; quantity: number }) => {
      const response = await apiRequest("POST", "/api/buy", {
        playerId: PLAYER_ID,
        item,
        quantity,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Purchase Successful! 💰",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to buy item",
        variant: "destructive",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: "pumpkins"; quantity: number }) => {
      const response = await apiRequest("POST", "/api/sell", {
        playerId: PLAYER_ID,
        item,
        quantity,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Sale Successful! 💰",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sell item",
        variant: "destructive",
      });
    },
  });

  const expandMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/expand", {
        playerId: PLAYER_ID,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Field Expanded! 🎯",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to expand field",
        variant: "destructive",
      });
    },
  });

  const rewardedAdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reward-coins", {
        playerId: PLAYER_ID,
        amount: 50,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to award coins",
        variant: "destructive",
      });
    },
  });

  const handlePlotClick = (row: number, col: number) => {
    if (!plots || !player) return;
    
    // Check if the plot is within the current field size
    if (row >= player.fieldSize || col >= player.fieldSize) return;
    
    const plot = plots.find(p => p.row === row && p.col === col);
    if (!plot) return;

    // Automatically determine action based on plot state
    if (plot.state === "empty") {
      // Check if player has the selected seed type
      const hasSelectedSeeds = selectedCropType === "apple" ? 
        (player.appleSeeds > 0) : 
        (player.seeds > 0);
      
      if (!hasSelectedSeeds) {
        const cropName = selectedCropType === "apple" ? "apple" : "pumpkin";
        toast({
          title: "No Seeds Available",
          description: `You don't have any ${cropName} seeds. Buy some from the marketplace!`,
          variant: "destructive",
        });
        return;
      }
      
      plantMutation.mutate({ row, col, cropType: selectedCropType });
    } else if (plot.state === "mature") {
      harvestMutation.mutate({ row, col });
    } else if ((plot.state === "seedling" || plot.state === "growing") && !plot.fertilized && player.fertilizer > 0) {
      // Apply fertilizer if available and plot isn't already fertilized
      fertilizeMutation.mutate({ row, col });
    } else {
      // For seedling and growing states, show info about when it will be ready
      const minutesPlanted = plot.plantedAt ? Math.floor((Date.now() - new Date(plot.plantedAt).getTime()) / (1000 * 60)) : 0;
      const effectiveMinutes = plot.fertilized ? minutesPlanted * 2 : minutesPlanted;
      
      // Different growth times based on crop type
      const growthTime = plot.cropType === "apple" ? 15 : 60;
      const minutesRemaining = Math.max(0, growthTime - effectiveMinutes);
      
      const cropName = plot.cropType === "apple" ? "apple" : "pumpkin";
      let statusMessage = `This ${cropName} will be ready to harvest in ${minutesRemaining} minutes`;
      if (plot.fertilized) {
        statusMessage += " (fertilized - growing 2x faster!)";
      } else if (player.fertilizer > 0) {
        statusMessage += " (click again to apply fertilizer)";
      }
      
      toast({
        title: `${cropName.charAt(0).toUpperCase() + cropName.slice(1)} Growing 🌱`,
        description: statusMessage,
      });
    }
  };

  const getPlotEmoji = (state: string, cropType?: string) => {
    if (cropType === "apple") {
      switch (state) {
        case "seedling": return "🌱";
        case "growing": return "🌳";
        case "mature": return "🍎";
        default: return null;
      }
    } else {
      switch (state) {
        case "seedling": return "🌱";
        case "growing": return "🌿";
        case "mature": return "🎃";
        default: return null;
      }
    }
  };

  const getPlotStyles = (state: string) => {
    switch (state) {
      case "seedling":
        return "bg-gradient-to-br from-green-300/30 to-amber-800 border-green-500/70 animate-pulse-gentle";
      case "growing":
        return "bg-gradient-to-br from-green-400/50 to-amber-800 border-green-600";
      case "mature":
        return "bg-gradient-to-br from-orange-300/30 to-amber-800 border-orange-500 cursor-pointer hover:scale-110";
      default:
        return "bg-gradient-to-br from-amber-800 to-amber-900 border-amber-700/50 cursor-pointer hover:border-golden hover:scale-105";
    }
  };

  const getTimeUntilMature = (plot: Plot) => {
    if (!plot.plantedAt || plot.state === "empty" || plot.state === "mature") return null;
    
    const now = new Date().getTime();
    const planted = new Date(plot.plantedAt).getTime();
    const minutesElapsed = Math.floor((now - planted) / (1000 * 60));
    const effectiveMinutes = plot.fertilized ? minutesElapsed * 2 : minutesElapsed;
    
    // Different growth times based on crop type
    const growthTime = plot.cropType === "apple" ? 15 : 60;
    const minutesRemaining = Math.max(0, growthTime - effectiveMinutes);
    
    if (minutesRemaining === 0) return "Ready!";
    return `${minutesRemaining}m`;
  };

  const activePlots = plots?.filter(p => p.state !== "empty").length || 0;
  const readyToHarvest = plots?.filter(p => p.state === "mature").length || 0;
  
  // Calculate expansion cost
  const getExpansionCost = (currentSize: number) => {
    if (currentSize >= 10) return null;
    const newSize = currentSize + 1;
    return Math.pow(2, newSize - 4) * 50;
  };
  
  const expansionCost = player ? getExpansionCost(player.fieldSize) : null;

  if (playerLoading || plotsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-dark-brown">Loading your pumpkin patch...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-100 to-orange-300 overflow-x-hidden">
      {/* Decorative autumn leaves */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl text-deep-red opacity-20 animate-bounce-gentle">🍁</div>
        <div className="absolute top-32 right-20 text-4xl text-golden opacity-30 animate-pulse-gentle">🍂</div>
        <div className="absolute bottom-20 left-32 text-5xl text-rich-brown opacity-25 animate-bounce-gentle">🌾</div>
        <div className="absolute bottom-40 right-10 text-3xl text-deep-red opacity-20 animate-pulse-gentle">🍁</div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-amber-900 to-amber-800 shadow-2xl border-b-4 border-golden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="text-6xl mr-4 animate-pulse-gentle">🎃</div>
              <div>
                <h1 className="font-bold text-4xl lg:text-5xl text-golden drop-shadow-lg">Pumpkin Patch</h1>
                <p className="text-cream/80 font-medium">Autumn Farming Adventure</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 lg:gap-6">
              <div className="bg-golden/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-golden/50">
                <div className="flex items-center gap-2">
                  <Coins className="text-golden text-xl" />
                  <div>
                    <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Coins</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-cream">{player?.coins || 0}</p>
                      <RewardedAdButton
                        onRewardEarned={() => rewardedAdMutation.mutate()}
                        disabled={rewardedAdMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-green-500/50">
                <div className="flex items-center gap-2">
                  <Sprout className="text-green-600 text-xl" />
                  <div>
                    <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Pumpkin Seeds</p>
                    <p className="text-lg font-bold text-cream">{player?.seeds || 0}</p>
                  </div>
                </div>
              </div>

              {player && (player.appleSeeds || 0) > 0 && (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-red-500/50">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">🌳</div>
                    <div>
                      <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Apple Seeds</p>
                      <p className="text-lg font-bold text-cream">{player.appleSeeds || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {player && (player.apples || 0) > 0 && (
                <div className="bg-red-600/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-red-600/50">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">🍎</div>
                    <div>
                      <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Apples</p>
                      <p className="text-lg font-bold text-cream">{player.apples || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-orange-500/50">
                <div className="flex items-center gap-2">
                  <div className="text-xl">🎃</div>
                  <div>
                    <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Pumpkins</p>
                    <p className="text-lg font-bold text-cream">{player?.pumpkins || 0}</p>
                  </div>
                </div>
              </div>

              {player && (player.pies || 0) > 0 && (
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-amber-500/50">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">🥧</div>
                    <div>
                      <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Pies</p>
                      <p className="text-lg font-bold text-cream">{player.pies || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {((player?.fertilizer || 0) > 0 || (player?.tools || 0) > 0) && (
                <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-purple-500/50">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">⚡</div>
                    <div>
                      <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Supplies</p>
                      <p className="text-sm font-bold text-cream">
                        {(player?.fertilizer || 0) > 0 && `${player?.fertilizer} fertilizer `}
                        {(player?.tools || 0) > 0 && `${player?.tools} tools`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Header Ad */}
      <div className="container mx-auto px-4 pt-4 relative z-10">
        <HeaderAd />
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Game Info Sidebar */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <Card className="bg-white/90 backdrop-blur-sm border-4 border-amber-800/30">
              <CardContent className="p-6">
                <h2 className="font-bold text-2xl text-dark-brown mb-6 flex items-center gap-2">
                  <TrendingUp className="text-golden" />
                  Farm Guide
                </h2>

                <div className="bg-cream/80 rounded-xl p-4 border-2 border-golden/30 mb-6">
                  <h3 className="font-semibold text-dark-brown mb-3">How to Farm</h3>
                  <div className="space-y-2 text-sm text-dark-brown">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span>Use Farmer's Bolt to select crop type</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌱</span>
                      <span>Click empty plots to plant selected seeds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎃</span>
                      <span>Click mature crops to harvest</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span>Sell crops to buy more seeds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📏</span>
                      <span>Expand your field for more space</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span>Click growing plants to apply fertilizer</span>
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          {/* Main Field */}
          <div className="xl:col-span-3 order-1 xl:order-2">
            <Card className="bg-white/90 backdrop-blur-sm border-4 border-amber-800/30">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <h2 className="font-bold text-3xl text-dark-brown mb-4 sm:mb-0 flex items-center gap-2">
                    <MapPin className="text-golden" />
                    Your Pumpkin Patch
                  </h2>
                  <div className="bg-gradient-to-r from-golden to-orange-500 rounded-xl px-4 py-2 border-2 border-golden shadow-lg">
                    <p className="text-white font-semibold">Field Size: {player?.fieldSize || 3}×{player?.fieldSize || 3}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-800/20 to-amber-900/20 rounded-xl p-4 border-2 border-amber-800/30">
                  <div 
                    className={`grid gap-2 max-w-4xl mx-auto`}
                    style={{ 
                      gridTemplateColumns: `repeat(${player?.fieldSize || 3}, minmax(0, 1fr))`,
                      maxWidth: `${Math.min(600, (player?.fieldSize || 3) * 60)}px`
                    }}
                  >
                    {Array.from({ length: player?.fieldSize || 3 }, (_, row) =>
                      Array.from({ length: player?.fieldSize || 3 }, (_, col) => {
                        const plot = plots?.find(p => p.row === row && p.col === col);
                        const emoji = plot ? getPlotEmoji(plot.state, plot.cropType || "pumpkin") : null;
                        const styles = plot ? getPlotStyles(plot.state) : getPlotStyles("empty");
                        const timeRemaining = plot ? getTimeUntilMature(plot) : null;
                        
                        return (
                          <div
                            key={`${row}-${col}`}
                            className={`aspect-square rounded-lg border-2 shadow-lg transition-all duration-200 flex flex-col items-center justify-center relative ${styles}`}
                            onClick={() => handlePlotClick(row, col)}
                          >
                            {emoji ? (
                              <span className="text-2xl animate-bounce-gentle">{emoji}</span>
                            ) : (
                              <Plus className="text-cream/50 text-lg hover:text-golden transition-colors" />
                            )}
                            
                            {/* Countdown Timer */}
                            {timeRemaining && plot?.state !== "mature" && (
                              <div className="absolute bottom-1 text-xs font-bold text-center bg-black/70 text-white px-1 rounded backdrop-blur-sm">
                                {timeRemaining}
                              </div>
                            )}
                            
                            {/* Fertilizer indicator */}
                            {plot?.fertilized && plot.state !== "empty" && (
                              <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-800 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                                ⚡
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-r from-cream to-golden/20 rounded-xl p-4 border-2 border-golden/30">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-dark-brown font-semibold">Active Plots: </span>
                        <span className="text-rich-brown font-bold">{activePlots}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-dark-brown font-semibold">Ready to Harvest: </span>
                        <span className="text-orange-600 font-bold">{readyToHarvest}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6">
          <Card className="bg-white/90 backdrop-blur-sm border-4 border-amber-800/30">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white shadow-lg hover:scale-105 transition-all duration-200"
                    onClick={() => setShowChallenges(!showChallenges)}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    {showChallenges ? "Close Challenges" : "Open Challenges"}
                  </Button>
                  
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white shadow-lg hover:scale-105 transition-all duration-200"
                    onClick={() => expandMutation.mutate()}
                    disabled={expandMutation.isPending || !expansionCost || (player?.coins || 0) < expansionCost}
                  >
                    <Expand className="mr-2 h-4 w-4" />
                    {expansionCost ? `Expand Field (${expansionCost} coins)` : "Max Size Reached"}
                  </Button>
                </div>

                {/* Farmer's Bolt - Crop Selection */}
                <div className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl p-4 border-2 border-amber-800/50">
                  <h3 className="font-bold text-dark-brown mb-3 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Farmer's Bolt - Select Crop to Plant
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setSelectedCropType("pumpkin")}
                      className={`flex items-center gap-2 ${
                        selectedCropType === "pumpkin" 
                          ? "bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-800" 
                          : "bg-white hover:bg-orange-50 text-dark-brown border-2 border-orange-300"
                      }`}
                      disabled={player?.seeds === 0}
                    >
                      <span className="text-lg">🎃</span>
                      <div className="text-left">
                        <div className="font-semibold">Pumpkin Seeds</div>
                        <div className="text-xs opacity-80">You have: {player?.seeds || 0}</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => setSelectedCropType("apple")}
                      className={`flex items-center gap-2 ${
                        selectedCropType === "apple" 
                          ? "bg-red-600 hover:bg-red-700 text-white border-2 border-red-800" 
                          : "bg-white hover:bg-red-50 text-dark-brown border-2 border-red-300"
                      }`}
                      disabled={player?.appleSeeds === 0}
                    >
                      <span className="text-lg">🍎</span>
                      <div className="text-left">
                        <div className="font-semibold">Apple Seeds</div>
                        <div className="text-xs opacity-80">You have: {player?.appleSeeds || 0}</div>
                      </div>
                    </Button>
                  </div>
                  <div className="mt-3 text-sm text-dark-brown/70">
                    Selected: <span className="font-semibold text-dark-brown">
                      {selectedCropType === "apple" ? "🍎 Apple" : "🎃 Pumpkin"} 
                    </span> - Click empty plots to plant this crop type
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="bg-amber-800 hover:bg-amber-900 text-white border-amber-700 shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-amber-800 hover:bg-amber-900 text-white border-amber-700 shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kitchen */}
        {showKitchen && player && (
          <div className="mt-6">
            <Kitchen player={player} />
          </div>
        )}

        {/* Challenges */}
        {showChallenges && (
          <div className="mt-6">
            <ChallengePanel playerId={PLAYER_ID} />
          </div>
        )}

        {/* Footer Ad */}
        <FooterAd />
      </div>
    </div>
  );
}
