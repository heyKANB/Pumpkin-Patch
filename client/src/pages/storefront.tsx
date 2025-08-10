import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, Store, Clock, Coins, Trophy, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomerOrder, Player } from "@shared/schema";

export default function Storefront() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const playerId = "default";

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
    mutationFn: () => apiRequest(`/api/player/${playerId}/orders/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }),
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
    mutationFn: (orderId: string) => apiRequest("/api/fulfill-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, orderId }),
    }),
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

        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
            <User className="w-6 h-6 mr-2" />
            Customer Orders ({pendingOrders.length})
          </h2>
          
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
                    
                    {/* Required Items */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required:</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {order.requiredItems.pumpkins && (
                          <div className="flex items-center">
                            🎃 {order.requiredItems.pumpkins}
                            {player && player.pumpkins >= order.requiredItems.pumpkins ? 
                              <span className="ml-1 text-green-600">✓</span> : 
                              <span className="ml-1 text-red-600">✗</span>
                            }
                          </div>
                        )}
                        {order.requiredItems.apples && (
                          <div className="flex items-center">
                            🍎 {order.requiredItems.apples}
                            {player && player.apples >= order.requiredItems.apples ? 
                              <span className="ml-1 text-green-600">✓</span> : 
                              <span className="ml-1 text-red-600">✗</span>
                            }
                          </div>
                        )}
                        {order.requiredItems.pies && (
                          <div className="flex items-center">
                            🥧 {order.requiredItems.pies}
                            {player && player.pies >= order.requiredItems.pies ? 
                              <span className="ml-1 text-green-600">✓</span> : 
                              <span className="ml-1 text-red-600">✗</span>
                            }
                          </div>
                        )}
                        {order.requiredItems.applePies && (
                          <div className="flex items-center">
                            🍎🥧 {order.requiredItems.applePies}
                            {player && player.applePies >= order.requiredItems.applePies ? 
                              <span className="ml-1 text-green-600">✓</span> : 
                              <span className="ml-1 text-red-600">✗</span>
                            }
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
        </div>

        {/* Recently Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
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
      </div>
    </div>
  );
}