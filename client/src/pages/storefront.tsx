import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Store, Clock, Coins, Trophy, User, RefreshCw, ShoppingBag, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomerOrder, Player } from "@shared/schema";

interface SellItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
}

const sellItems: SellItem[] = [
  {
    id: "pumpkins",
    name: "Pumpkins",
    icon: "🎃",
    price: 22, // Slightly less than order fulfillment (which varies but averages ~25-30)
    description: "Fresh pumpkins from your farm"
  },
  {
    id: "apples", 
    name: "Apples",
    icon: "🍎",
    price: 12, // Slightly less than order fulfillment (which varies but averages ~15-18)
    description: "Crisp apples from your orchard"
  }
];

export default function Storefront() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const playerId = "default";
  const [sellQuantities, setSellQuantities] = useState<{ [key: string]: number }>({});

  // Fetch player data
  const { data: player } = useQuery<Player>({
    queryKey: ["/api/player", playerId],
  });

  // Fetch customer orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<CustomerOrder[]>({
    queryKey: ["/api/player", playerId, "orders"],
    refetchInterval: 30000, // Refresh orders every 30 seconds
  });

  // Generate new orders mutation
  const generateOrdersMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/player/${playerId}/orders/generate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "orders"] });
      toast({ title: "New customer orders generated!" });
    },
    onError: () => {
      toast({ title: "Failed to generate orders", variant: "destructive" });
    },
  });

  // Fulfill order mutation
  const fulfillOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", "/api/fulfill-order", { playerId, orderId });
      return await response.json();
    },
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId, "orders"] });
      toast({ title: data.message || "Order fulfilled!" });
      
      // Wait a moment then check if we need to generate new orders
      setTimeout(() => {
        const currentOrders = queryClient.getQueryData<CustomerOrder[]>(["/api/player", playerId, "orders"]) || [];
        const activeOrders = currentOrders.filter(order => order.status === "pending");
        if (activeOrders.length < 2) {
          generateOrdersMutation.mutate();
        }
      }, 1000);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to fulfill order", variant: "destructive" });
    },
  });

  // Auto-generate orders when component mounts if none exist or when orders are fulfilled
  useEffect(() => {
    const activeOrders = orders.filter(order => order.status === "pending");
    if (activeOrders.length === 0 && !ordersLoading && !generateOrdersMutation.isPending) {
      generateOrdersMutation.mutate();
    }
  }, [orders, ordersLoading]);

  const handleFulfillOrder = (orderId: string) => {
    fulfillOrderMutation.mutate(orderId);
  };

  // Selling functionality
  const getSellQuantity = (itemId: string): number => {
    return sellQuantities[itemId] || 1;
  };

  const setSellQuantity = (itemId: string, quantity: number) => {
    setSellQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const getMaxSellQuantity = (item: SellItem): number => {
    if (!player) return 0;
    if (item.id === "pumpkins") return player.pumpkins || 0;
    if (item.id === "apples") return player.apples || 0;
    return 0;
  };

  const sellItemMutation = useMutation({
    mutationFn: async ({ item, quantity }: { item: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/sell", {
        playerId,
        item,
        quantity
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      toast({ title: data.message || "Items sold successfully!" });
      // Reset quantity to 1 after successful sale
      setSellQuantities({});
    },
    onError: (error: any) => {
      toast({ 
        title: "Sale failed", 
        description: error.message || "Failed to sell items",
        variant: "destructive" 
      });
    },
  });

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return "bg-red-100 text-red-800 border-red-200";
      case 2: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 3: return "Premium";
      case 2: return "Urgent";
      default: return "Normal";
    }
  };

  const getTimeRemaining = (expiresAt: string | Date) => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const remaining = expires - now;
    
    if (remaining <= 0) return "Expired";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const canFulfillOrder = (order: CustomerOrder) => {
    if (!player || order.status !== "pending") return false;
    
    const required = order.requiredItems;
    return (!required.pumpkins || player.pumpkins >= required.pumpkins) &&
           (!required.apples || player.apples >= required.apples) &&
           (!required.pies || player.pies >= required.pies) &&
           (!required.applePies || player.applePies >= required.applePies);
  };

  const pendingOrders = orders.filter(order => order.status === "pending");
  const completedOrders = orders.filter(order => order.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-950">
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
              <Store className="w-5 h-5 mr-2" />
              Store Front
            </h1>
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            {generateOrdersMutation.isPending ? (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating new orders...
              </div>
            ) : (
              <div className="flex items-center">
                <Store className="w-4 h-4 mr-2" />
                Customer Orders
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Player Stats */}
        {player && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-700 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">💰 {player.coins}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Coins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">🎃 {player.pumpkins}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pumpkins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">🍎 {player.apples}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Apples</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">🥧 {player.pies + player.applePies}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pies</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Orders and Selling */}
        <Tabs defaultValue="orders" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Customer Orders ({pendingOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Sell Items</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {pendingOrders.length === 0 ? (
              <Card className="border-orange-200 dark:border-orange-700">
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 mx-auto text-orange-400 mb-4" />
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    No Active Orders
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    New customer orders will appear here automatically.
                  </p>
                  {generateOrdersMutation.isPending ? (
                    <div className="flex items-center text-orange-600">
                      <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                      Generating customer orders...
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Orders will appear automatically when customers visit your store.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-orange-200 dark:border-orange-700 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{order.customerAvatar}</span>
                          <div>
                            <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                              {order.customerName}
                            </CardTitle>
                            <Badge className={getPriorityColor(order.priority)}>
                              {getPriorityText(order.priority)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            {getTimeRemaining(order.expiresAt)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        {order.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {order.description}
                      </p>
                      
                      {/* Required items */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {order.requiredItems.pumpkins && (
                            <div className="flex items-center justify-between">
                              <span>🎃 Pumpkins:</span>
                              <span className={player && player.pumpkins >= order.requiredItems.pumpkins ? "text-green-600" : "text-red-600"}>
                                {order.requiredItems.pumpkins}
                              </span>
                            </div>
                          )}
                          {order.requiredItems.apples && (
                            <div className="flex items-center justify-between">
                              <span>🍎 Apples:</span>
                              <span className={player && player.apples >= order.requiredItems.apples ? "text-green-600" : "text-red-600"}>
                                {order.requiredItems.apples}
                              </span>
                            </div>
                          )}
                          {order.requiredItems.pies && (
                            <div className="flex items-center justify-between">
                              <span>🥧 Pumpkin Pies:</span>
                              <span className={player && player.pies >= order.requiredItems.pies ? "text-green-600" : "text-red-600"}>
                                {order.requiredItems.pies}
                              </span>
                            </div>
                          )}
                          {order.requiredItems.applePies && (
                            <div className="flex items-center justify-between">
                              <span>🍏 Apple Pies:</span>
                              <span className={player && player.applePies >= order.requiredItems.applePies ? "text-green-600" : "text-red-600"}>
                                {order.requiredItems.applePies}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Rewards */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rewards:</div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Coins className="w-4 h-4 mr-1 text-yellow-500" />
                            {order.rewards.coins}
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1 text-purple-500" />
                            {order.rewards.experience} XP
                          </div>
                          {order.rewards.bonus && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">+ Bonus</div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleFulfillOrder(order.id)}
                        disabled={!canFulfillOrder(order) || fulfillOrderMutation.isPending}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300"
                      >
                        {canFulfillOrder(order) ? "Fulfill Order" : "Missing Items"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Recently Completed Orders */}
            {completedOrders.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-4">
                  Recently Completed ({completedOrders.slice(-3).length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {completedOrders.slice(-3).map((order) => (
                    <Card key={order.id} className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{order.customerAvatar}</span>
                          <div>
                            <div className="font-medium text-green-800 dark:text-green-200">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                              {order.title}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Earned {order.rewards.coins} coins, {order.rewards.experience} XP
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sell">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2" />
                Sell Your Produce
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sellItems.map((item) => {
                  const quantity = getSellQuantity(item.id);
                  const maxQuantity = getMaxSellQuantity(item);
                  const totalPrice = item.price * quantity;
                  const canSell = maxQuantity > 0;
                  
                  return (
                    <Card key={item.id} className={`bg-white dark:bg-gray-800 border-2 transition-all duration-300 hover:shadow-lg ${
                      canSell ? "border-orange-200 dark:border-orange-700" : "border-gray-300 dark:border-gray-600 opacity-75"
                    }`}>
                      <CardHeader className="text-center pb-3">
                        <div className={`text-4xl mb-2 ${!canSell ? "grayscale" : ""}`}>{item.icon}</div>
                        <CardTitle className={`text-lg ${!canSell ? "text-gray-500 dark:text-gray-400" : "text-orange-800 dark:text-orange-200"}`}>
                          {item.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {item.description}
                        </p>
                        
                        {!canSell ? (
                          <div className="mb-4">
                            <div className="text-gray-500 dark:text-gray-400 font-semibold mb-2">
                              📦 No {item.name.toLowerCase()} available
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center mb-4">
                              <Coins className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                                {item.price} each
                              </span>
                            </div>

                            {/* Quantity selector */}
                            <div className="mb-4">
                              <div className="flex items-center justify-center space-x-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0"
                                  disabled={quantity <= 1}
                                  onClick={() => setSellQuantity(item.id, quantity - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                
                                <div className="flex flex-col items-center">
                                  <span className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                    {quantity}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Available: {maxQuantity}
                                  </span>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0"
                                  disabled={quantity >= maxQuantity}
                                  onClick={() => setSellQuantity(item.id, quantity + 1)}
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
                                onClick={() => setSellQuantity(item.id, maxQuantity)}
                                disabled={quantity >= maxQuantity}
                              >
                                Sell All ({maxQuantity})
                              </Button>
                            </div>
                          </>
                        )}
                        
                        <Button
                          className={`w-full ${
                            canSell
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                          }`}
                          disabled={!canSell || sellItemMutation.isPending}
                          onClick={() => sellItemMutation.mutate({ item: item.id, quantity })}
                        >
                          {sellItemMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Coins className="w-4 h-4 mr-2" />
                          )}
                          {canSell ? `Sell for ${totalPrice} coins` : "None Available"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">💡 Selling vs. Customer Orders</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Selling directly gives you immediate coins but at slightly lower prices than fulfilling customer orders. 
                  Customer orders offer better rewards but require specific items and have time limits.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}