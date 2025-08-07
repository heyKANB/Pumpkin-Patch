import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { type Player, type Plot } from "@shared/schema";
import { Coins, Sprout, ShoppingCart, DollarSign, Expand, Save, Settings, Plus, Clock, MapPin, TrendingUp, Store, ChefHat } from "lucide-react";
import Marketplace from "@/components/marketplace";
import { Kitchen } from "@/components/kitchen";
import { useState } from "react";

const PLAYER_ID = "default";

export default function Game() {
  const { toast } = useToast();
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showKitchen, setShowKitchen] = useState(false);

  // Queries
  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ["/api/player", PLAYER_ID],
  });

  const { data: plots, isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/player", PLAYER_ID, "plots"],
  });

  // Mutations
  const plantMutation = useMutation({
    mutationFn: async ({ row, col }: { row: number; col: number }) => {
      const response = await apiRequest("POST", "/api/plant", {
        playerId: PLAYER_ID,
        row,
        col,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Seed Planted! 🌱",
        description: data.message || "Your pumpkin will mature in 60 minutes",
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
        title: "Pumpkin Harvested! 🎃",
        description: data.message || "Added pumpkin to inventory",
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

  const handlePlotClick = (row: number, col: number) => {
    if (!plots || !player) return;
    
    // Check if the plot is within the current field size
    if (row >= player.fieldSize || col >= player.fieldSize) return;
    
    const plot = plots.find(p => p.row === row && p.col === col);
    if (!plot) return;

    // Automatically determine action based on plot state
    if (plot.state === "empty") {
      plantMutation.mutate({ row, col });
    } else if (plot.state === "mature") {
      harvestMutation.mutate({ row, col });
    } else if ((plot.state === "seedling" || plot.state === "growing") && !plot.fertilized && player.fertilizer > 0) {
      // Apply fertilizer if available and plot isn't already fertilized
      fertilizeMutation.mutate({ row, col });
    } else {
      // For seedling and growing states, show info about when it will be ready
      const minutesPlanted = plot.plantedAt ? Math.floor((Date.now() - new Date(plot.plantedAt).getTime()) / (1000 * 60)) : 0;
      const effectiveMinutes = plot.fertilized ? minutesPlanted * 2 : minutesPlanted;
      const minutesRemaining = Math.max(0, 60 - effectiveMinutes);
      
      let statusMessage = `This pumpkin will be ready to harvest in ${minutesRemaining} minutes`;
      if (plot.fertilized) {
        statusMessage += " (fertilized - growing 2x faster!)";
      } else if (player.fertilizer > 0) {
        statusMessage += " (click again to apply fertilizer)";
      }
      
      toast({
        title: "Pumpkin Growing 🌱",
        description: statusMessage,
      });
    }
  };

  const getPlotEmoji = (state: string) => {
    switch (state) {
      case "seedling": return "🌱";
      case "growing": return "🌿";
      case "mature": return "🎃";
      default: return null;
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
                    <p className="text-lg font-bold text-cream">{player?.coins || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-green-500/50">
                <div className="flex items-center gap-2">
                  <Sprout className="text-green-600 text-xl" />
                  <div>
                    <p className="text-xs text-cream/70 font-medium uppercase tracking-wide">Seeds</p>
                    <p className="text-lg font-bold text-cream">{player?.seeds || 0}</p>
                  </div>
                </div>
              </div>

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
                      <span className="text-lg">🌱</span>
                      <span>Click empty plots to plant seeds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎃</span>
                      <span>Click mature pumpkins to harvest</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span>Sell pumpkins to buy more seeds</span>
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

                <div className="bg-cream/80 rounded-xl p-4 border-2 border-golden/30">
                  <h3 className="font-semibold text-dark-brown mb-3 flex items-center gap-2">
                    <Clock className="text-golden" />
                    Growth Stages
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🌱</span>
                      <span className="text-dark-brown">Sprout (0-29 minutes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🌿</span>
                      <span className="text-dark-brown">Growing (30-59 minutes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🎃</span>
                      <span className="text-dark-brown">Mature (60+ minutes)</span>
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
                        const emoji = plot ? getPlotEmoji(plot.state) : null;
                        const styles = plot ? getPlotStyles(plot.state) : getPlotStyles("empty");
                        
                        return (
                          <div
                            key={`${row}-${col}`}
                            className={`aspect-square rounded-lg border-2 shadow-lg transition-all duration-200 flex items-center justify-center relative ${styles}`}
                            onClick={() => handlePlotClick(row, col)}
                          >
                            {emoji ? (
                              <span className="text-2xl animate-bounce-gentle">{emoji}</span>
                            ) : (
                              <Plus className="text-cream/50 text-lg hover:text-golden transition-colors" />
                            )}
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
                    <div className="flex items-center gap-2">
                      <Clock className="text-golden" />
                      <span className="text-dark-brown font-semibold">Day {player?.day || 1} - Autumn</span>
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
                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:scale-105 transition-all duration-200"
                    onClick={() => setShowMarketplace(!showMarketplace)}
                  >
                    <Store className="mr-2 h-4 w-4" />
                    {showMarketplace ? "Close Marketplace" : "Open Marketplace"}
                  </Button>
                  
                  <Button
                    className="bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900 text-white shadow-lg hover:scale-105 transition-all duration-200"
                    onClick={() => setShowKitchen(!showKitchen)}
                  >
                    <span className="mr-2 text-lg">👨‍🍳</span>
                    {showKitchen ? "Close Kitchen" : "Open Kitchen"}
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

        {/* Marketplace */}
        {showMarketplace && player && (
          <div className="mt-6">
            <Marketplace player={player} />
          </div>
        )}

        {/* Kitchen */}
        {showKitchen && player && (
          <div className="mt-6">
            <Kitchen player={player} />
          </div>
        )}
      </div>
    </div>
  );
}
