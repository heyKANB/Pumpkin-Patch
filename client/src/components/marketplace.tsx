import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Player } from "@shared/schema";
import { ShoppingCart, DollarSign, Package, Hammer, Zap, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface MarketplaceProps {
  player: Player;
}

interface MarketItem {
  id: string;
  name: string;
  description: string;
  buyPrice?: number;
  sellPrice?: number;
  icon: React.ReactNode;
  playerQuantity: number;
  canBuy: boolean;
  canSell: boolean;
}

export default function Marketplace({ player }: MarketplaceProps) {
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (itemId: string) => quantities[itemId] || 1;
  const setQuantity = (itemId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const buyMutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/buy", {
        playerId: player.id,
        item,
        quantity,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Purchase Successful!",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Not enough coins",
        variant: "destructive",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/sell", {
        playerId: player.id,
        item,
        quantity,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      toast({
        title: "Sale Successful!",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sale Failed",
        description: error.message || "Not enough items",
        variant: "destructive",
      });
    },
  });

  const marketItems: MarketItem[] = [
    {
      id: "seeds",
      name: "Pumpkin Seeds",
      description: "Plant these to grow pumpkins",
      buyPrice: 10,
      sellPrice: 8,
      icon: <span className="text-2xl">🌱</span>,
      playerQuantity: player.seeds,
      canBuy: true,
      canSell: player.seeds > 0,
    },
    {
      id: "pumpkins",
      name: "Pumpkins",
      description: "Fresh harvested pumpkins",
      sellPrice: 25,
      icon: <span className="text-2xl">🎃</span>,
      playerQuantity: player.pumpkins,
      canBuy: false,
      canSell: player.pumpkins > 0,
    },
    {
      id: "fertilizer",
      name: "Fertilizer",
      description: "Speeds up crop growth",
      buyPrice: 25,
      icon: <Zap className="text-2xl text-yellow-600" />,
      playerQuantity: player.fertilizer,
      canBuy: true,
      canSell: false,
    },
    {
      id: "tools",
      name: "Farm Tools",
      description: "Improves farming efficiency",
      buyPrice: 50,
      icon: <Hammer className="text-2xl text-gray-600" />,
      playerQuantity: player.tools,
      canBuy: true,
      canSell: false,
    },
  ];

  const handleBuy = (item: MarketItem) => {
    const quantity = getQuantity(item.id);
    buyMutation.mutate({ item: item.id, quantity });
  };

  const handleSell = (item: MarketItem) => {
    const quantity = Math.min(getQuantity(item.id), item.playerQuantity);
    sellMutation.mutate({ item: item.id, quantity });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-4 border-amber-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-dark-brown">
          <ShoppingCart className="text-golden" />
          Autumn Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketItems.map((item) => (
            <Card key={item.id} className="border-2 border-amber-800/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark-brown">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <Badge variant="outline" className="text-xs">
                      You have: {item.playerQuantity}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQuantity(item.id, getQuantity(item.id) - 1)}
                      disabled={getQuantity(item.id) <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="min-w-8 text-center font-semibold">
                      {getQuantity(item.id)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQuantity(item.id, getQuantity(item.id) + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Buy Section */}
                  {item.canBuy && item.buyPrice && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-green-800">Buy</span>
                        <div className="text-xs text-green-600">
                          {getQuantity(item.id)} × {item.buyPrice} = {getQuantity(item.id) * item.buyPrice} coins
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleBuy(item)}
                        disabled={
                          buyMutation.isPending || 
                          player.coins < item.buyPrice * getQuantity(item.id)
                        }
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Buy
                      </Button>
                    </div>
                  )}

                  {/* Sell Section */}
                  {item.canSell && item.sellPrice && (
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-orange-800">Sell</span>
                        <div className="text-xs text-orange-600">
                          {Math.min(getQuantity(item.id), item.playerQuantity)} × {item.sellPrice} = {Math.min(getQuantity(item.id), item.playerQuantity) * item.sellPrice} coins
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleSell(item)}
                        disabled={
                          sellMutation.isPending || 
                          item.playerQuantity === 0 ||
                          getQuantity(item.id) > item.playerQuantity
                        }
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Sell
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border-2 border-golden/30">
          <h3 className="font-semibold text-dark-brown mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => buyMutation.mutate({ item: "seeds", quantity: 5 })}
              disabled={buyMutation.isPending || player.coins < 50}
            >
              <Package className="h-3 w-3 mr-1" />
              Buy 5 Seeds (50 coins)
            </Button>
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => sellMutation.mutate({ item: "pumpkins", quantity: Math.min(5, player.pumpkins) })}
              disabled={sellMutation.isPending || player.pumpkins === 0}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Sell All Pumpkins
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}