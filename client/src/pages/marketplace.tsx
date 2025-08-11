import { Link } from "wouter";
import { ArrowLeft, ShoppingCart, Coins, Package, Zap, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Player } from "@shared/schema";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  action: string;
  type: 'seed' | 'fertilizer' | 'upgrade';
}

const shopItems: ShopItem[] = [
  {
    id: "pumpkin-seeds",
    name: "Pumpkin Seeds",
    description: "Plant these to grow pumpkins (60 min growth time)",
    price: 10,
    icon: "🎃",
    action: "buy-seeds",
    type: "seed"
  },
  {
    id: "apple-seeds", 
    name: "Apple Seeds",
    description: "Plant these to grow apples (15 min growth time)",
    price: 5,
    icon: "🍎",
    action: "buy-apple-seeds",
    type: "seed"
  },
  {
    id: "fertilizer",
    name: "Fertilizer",
    description: "Speeds up crop growth by 50%",
    price: 10,
    icon: "🌱",
    action: "buy-fertilizer", 
    type: "fertilizer"
  },
  {
    id: "field-expansion",
    name: "Expand Field",
    description: "Add more plots to your farm",
    price: 0, // Dynamic pricing
    icon: "🚜",
    action: "expand-field",
    type: "upgrade"
  },
  {
    id: "kitchen-expansion",
    name: "Expand Kitchen", 
    description: "Add more oven slots",
    price: 0, // Dynamic pricing
    icon: "🔥",
    action: "expand-kitchen",
    type: "upgrade"
  }
];

export default function Marketplace() {
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  
  const { data: player, isLoading } = useQuery<Player>({
    queryKey: ["/api/player", "default"],
  });

  const getQuantity = (itemId: string): number => {
    return quantities[itemId] || 1;
  };

  const setQuantity = (itemId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const getMaxQuantity = (item: ShopItem): number => {
    if (!player) return 1;
    const itemPrice = getItemPrice(item);
    return Math.floor(player.coins / itemPrice);
  };

  const buyItemMutation = useMutation({
    mutationFn: async ({ action, itemId, quantity }: { action: string; itemId: string; quantity: number }) => {
      // Map marketplace actions to API calls
      if (action === "buy-seeds") {
        const response = await fetch(`/api/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: "default", item: "seeds", quantity }),
          credentials: "include"
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        
        return response.json();
      } else if (action === "buy-apple-seeds") {
        const response = await fetch(`/api/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: "default", item: "apple-seeds", quantity }),
          credentials: "include"
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        
        return response.json();
      } else if (action === "buy-fertilizer") {
        const response = await fetch(`/api/buy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: "default", item: "fertilizer", quantity }),
          credentials: "include"
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        
        return response.json();
      } else {
        // For expansions, use original logic (no quantity)
        const response = await fetch(`/api/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: "default" }),
          credentials: "include"
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        
        return response.json();
      }
    },
    onSuccess: (data) => {
      // Invalidate all player-related queries to ensure UI updates across all pages
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Purchase Successful!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getItemPrice = (item: ShopItem): number => {
    if (!player) return item.price;
    
    if (item.id === "field-expansion") {
      // Calculate field expansion cost
      const currentSize = player.fieldSize || 3;
      const expansionCost = Math.pow(2, currentSize - 2) * 50;
      return expansionCost;
    }
    
    if (item.id === "kitchen-expansion") {
      // Calculate kitchen expansion cost  
      const currentSlots = player.kitchenSlots || 1;
      const costs = [100, 200, 400, 800];
      return costs[currentSlots - 1] || 1600;
    }
    
    return item.price;
  };

  const canAfford = (item: ShopItem, quantity: number = 1): boolean => {
    if (!player) return false;
    return player.coins >= (getItemPrice(item) * quantity);
  };

  const isUpgradeMaxed = (item: ShopItem): boolean => {
    if (!player) return false;
    
    if (item.id === "field-expansion") {
      return (player.fieldSize || 3) >= 10;
    }
    
    if (item.id === "kitchen-expansion") {
      return (player.kitchenSlots || 1) >= 5;
    }
    
    return false;
  };

  const isItemLocked = (item: ShopItem): boolean => {
    if (!player) return true;
    
    if (item.id === "apple-seeds") {
      return player.level < 2;
    }
    
    if (item.id === "kitchen-expansion") {
      return player.level < 2;
    }
    
    return false;
  };

  const getUnlockMessage = (item: ShopItem): string => {
    if (item.id === "apple-seeds") {
      return "Unlocks at Level 2";
    }
    if (item.id === "kitchen-expansion") {
      return "Unlocks at Level 2";
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-600 dark:text-blue-400">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-100 dark:from-blue-950 dark:to-purple-950">
      {/* Header with navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-blue-200 dark:border-blue-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Map
              </Button>
            </Link>
            <div className="h-6 w-px bg-blue-200 dark:bg-blue-700"></div>
            <h1 className="text-xl font-semibold text-blue-800 dark:text-blue-200 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Marketplace
            </h1>
          </div>
          
          {/* Player stats */}
          {player && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-purple-600 dark:text-purple-400 flex items-center font-semibold">
                ⭐ Level {player.level}
              </div>
              <div className="text-yellow-600 dark:text-yellow-400 flex items-center">
                <Coins className="w-4 h-4 mr-1" />
                {player.coins}
              </div>
              <div className="text-green-600 dark:text-green-400">
                🎃 {player.seeds}
              </div>
              {player.level >= 2 && (
                <div className="text-red-600 dark:text-red-400">
                  🍎 {player.appleSeeds}
                </div>
              )}
              <div className="text-blue-600 dark:text-blue-400">
                🌱 {player.fertilizer}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">
            Welcome to the Marketplace!
          </h2>
          <p className="text-lg text-blue-600 dark:text-blue-300">
            Purchase seeds, fertilizer, and upgrades for your farm
          </p>
        </div>

        {/* Shop items grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopItems.map((item) => {
            const price = getItemPrice(item);
            const quantity = getQuantity(item.id);
            const totalPrice = price * quantity;
            const affordable = canAfford(item, quantity);
            const maxed = isUpgradeMaxed(item);
            const locked = isItemLocked(item);
            const unlockMessage = getUnlockMessage(item);
            const maxQuantity = getMaxQuantity(item);
            const canBuyMultiple = item.type === 'seed' || item.type === 'fertilizer';
            
            return (
              <Card key={item.id} className={`bg-white dark:bg-gray-800 border-2 transition-all duration-300 hover:shadow-lg ${
                locked ? "border-gray-300 dark:border-gray-600 opacity-75" : "border-blue-200 dark:border-blue-700"
              }`}>
                <CardHeader className="text-center pb-3">
                  <div className={`text-4xl mb-2 ${locked ? "grayscale" : ""}`}>{item.icon}</div>
                  <CardTitle className={`text-lg ${locked ? "text-gray-500 dark:text-gray-400" : "text-blue-800 dark:text-blue-200"}`}>
                    {item.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {item.description}
                  </p>
                  
                  {locked ? (
                    <div className="mb-4">
                      <div className="text-red-500 dark:text-red-400 font-semibold mb-2">
                        🔒 {unlockMessage}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                          {canBuyMultiple ? `${price} each` : price}
                        </span>
                      </div>

                      {/* Quantity selector for purchasable items */}
                      {canBuyMultiple && !locked && !maxed && (
                        <div className="mb-4">
                          <div className="flex items-center justify-center space-x-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-8 h-8 p-0"
                              disabled={quantity <= 1}
                              onClick={() => setQuantity(item.id, quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                {quantity}
                              </span>
                              <span className="text-xs text-gray-500">
                                Max: {maxQuantity}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-8 h-8 p-0"
                              disabled={quantity >= maxQuantity}
                              onClick={() => setQuantity(item.id, quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {quantity > 1 && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Total: </span>
                              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                <Coins className="w-3 h-3 inline mr-1" />
                                {totalPrice}
                              </span>
                            </div>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 text-xs"
                            onClick={() => setQuantity(item.id, maxQuantity)}
                            disabled={quantity >= maxQuantity}
                          >
                            Buy Max ({maxQuantity})
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  
                  <Button
                    className={`w-full ${
                      locked
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                        : affordable && !maxed
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={locked || !affordable || maxed || buyItemMutation.isPending}
                    onClick={() => !locked && buyItemMutation.mutate({ 
                      action: item.action, 
                      itemId: item.id, 
                      quantity: canBuyMultiple ? quantity : 1 
                    })}
                  >
                    {buyItemMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Package className="w-4 h-4 mr-2" />
                    )}
                    {locked ? "Locked" : maxed ? "Maxed Out" : affordable ? "Purchase" : "Can't Afford"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}