import { Link } from "wouter";
import { Sprout, ChefHat, ShoppingCart, Store, MapPin, Settings, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Player } from "@shared/schema";
import { XPDisplay } from "@/components/XPDisplay";

const PLAYER_ID = "default";

interface MapLocation {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  available: boolean;
  position: { x: number; y: number };
  levelRequired?: number;
}

const mapLocations: MapLocation[] = [
  {
    id: "farm",
    name: "Farm Field", 
    description: "Plant and harvest crops in your pumpkin patch",
    icon: Sprout,
    route: "/farm",
    available: true,
    position: { x: 50, y: 40 }  // Central pumpkin patch area
  },
  {
    id: "kitchen", 
    name: "Kitchen",
    description: "Bake delicious pies from your harvested crops",
    icon: ChefHat,
    route: "/kitchen",
    available: true,
    position: { x: 75, y: 25 },  // "PUMPKIN" barn (upper right)
    levelRequired: 2
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy seeds, fertilizer, and sell your produce",
    icon: ShoppingCart,
    route: "/marketplace", 
    available: true,
    position: { x: 20, y: 60 }  // Market stall with orange awning (left)
  },
  {
    id: "storefront",
    name: "Store Front",
    description: "Fulfill customer orders and earn rewards",
    icon: Store,
    route: "/storefront",
    available: true,
    position: { x: 75, y: 75 }  // "GIFT STORE" building (bottom right)
  }
];

export default function Map() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: player } = useQuery<Player>({
    queryKey: ["/api/player", PLAYER_ID],
  });

  const isLocationUnlocked = (location: MapLocation): boolean => {
    if (!location.levelRequired) return location.available;
    if (!player) return false;
    return player.level >= location.levelRequired && location.available;
  };

  // Fix player initialization mutation for TestFlight users
  const fixInitializationMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/player/${PLAYER_ID}/fix-initialization`),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/player", PLAYER_ID] });
      
      if (data.success) {
        toast({
          title: "Starting Resources Restored!",
          description: `Added ${data.changes.coins || 0} coins, ${data.changes.seeds || 0} pumpkin seeds, ${data.changes.appleSeeds || 0} apple seeds`,
        });
      } else {
        toast({
          title: "Resources Already Sufficient",
          description: data.message,
          variant: "default"
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to restore resources",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  // Emergency reset mutation - forces restoration regardless of current values
  const emergencyResetMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/player/${PLAYER_ID}/emergency-reset`),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/player", PLAYER_ID] });
      
      if (data.success) {
        toast({
          title: "Emergency Reset Complete!",
          description: `Resources reset: ${data.changes.coins > 0 ? `+${data.changes.coins} coins` : ''} ${data.changes.seeds > 0 ? `+${data.changes.seeds} pumpkin seeds` : ''} ${data.changes.appleSeeds > 0 ? `+${data.changes.appleSeeds} apple seeds` : ''}`,
        });
      } else {
        toast({
          title: "Reset Failed",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Emergency reset failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  // Check if player might need initialization fix (very low resources)
  const mightNeedInitFix = player && player.coins < 10 && (
    (player.seeds + player.pumpkins) < 2 || 
    (player.appleSeeds + player.apples) < 2
  );
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-amber-900 to-orange-800 dark:from-slate-900 dark:via-amber-950 dark:to-orange-950 relative overflow-hidden">
      {/* Mountain Silhouettes */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 1200 800" className="absolute inset-0 w-full h-full">
          {/* Far back mountains - misty blue */}
          <path d="M0,350 L100,180 L200,220 L300,160 L400,200 L500,140 L600,180 L700,120 L800,160 L900,100 L1000,140 L1100,110 L1200,130 L1200,800 L0,800 Z" 
                fill="rgba(71, 85, 105, 0.2)" />
          
          {/* Mid mountains - purple haze */}
          <path d="M0,420 L150,250 L280,300 L420,200 L580,280 L720,220 L860,260 L1000,200 L1150,240 L1200,210 L1200,800 L0,800 Z" 
                fill="rgba(88, 28, 135, 0.25)" />
                
          {/* Closer mountains - brown autumn */}
          <path d="M0,480 L120,320 L250,380 L380,300 L520,360 L650,310 L780,350 L920,290 L1050,330 L1200,300 L1200,800 L0,800 Z" 
                fill="rgba(120, 53, 15, 0.35)" />
                
          {/* Foothills - green to amber */}
          <path d="M0,550 L100,450 L200,480 L350,420 L500,460 L650,430 L800,450 L950,420 L1100,440 L1200,430 L1200,800 L0,800 Z" 
                fill="rgba(34, 197, 94, 0.3)" />
        </svg>
      </div>
      {/* Autumn Forest */}
      <div className="absolute inset-0">
        {/* Dense forest background */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-green-900 via-amber-900 to-transparent opacity-40"></div>
        
        {/* Individual trees with autumn colors */}
        <div className="absolute bottom-16 left-8 w-12 h-32 bg-amber-700 rounded-t-full opacity-70 shadow-lg"></div>
        <div className="absolute bottom-20 left-16 w-8 h-24 bg-red-700 rounded-t-full opacity-80 shadow-md"></div>
        <div className="absolute bottom-12 left-24 w-10 h-28 bg-orange-600 rounded-t-full opacity-75 shadow-lg"></div>
        
        <div className="absolute bottom-24 right-12 w-16 h-36 bg-red-800 rounded-t-full opacity-70 shadow-xl"></div>
        <div className="absolute bottom-16 right-24 w-10 h-28 bg-amber-600 rounded-t-full opacity-80 shadow-lg"></div>
        <div className="absolute bottom-20 right-32 w-12 h-30 bg-orange-700 rounded-t-full opacity-75 shadow-lg"></div>
        
        <div className="absolute bottom-20 left-1/4 w-14 h-32 bg-yellow-600 rounded-t-full opacity-65 shadow-lg"></div>
        <div className="absolute bottom-16 left-1/3 w-10 h-26 bg-red-600 rounded-t-full opacity-70 shadow-md"></div>
        
        <div className="absolute bottom-28 right-1/4 w-18 h-38 bg-amber-800 rounded-t-full opacity-60 shadow-xl"></div>
        <div className="absolute bottom-12 right-1/3 w-12 h-28 bg-orange-800 rounded-t-full opacity-75 shadow-lg"></div>
      </div>
      {/* Floating autumn leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-2xl animate-pulse">🍂</div>
        <div className="absolute top-40 right-32 text-xl animate-bounce">🍁</div>
        <div className="absolute top-32 left-1/2 text-lg animate-pulse">🍂</div>
        <div className="absolute top-60 right-1/4 text-2xl animate-bounce">🍁</div>
      </div>
      {/* Header */}
      <div className="relative z-10 py-8">
        <div className="relative mx-auto max-w-7xl px-4">
          {/* XP Display - Positioned absolutely to not affect centering */}
          {player && (
            <div className="absolute top-0 right-4 z-20">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-amber-400">
                <div className="text-center">
                  <div className="text-xl mb-1">⭐</div>
                  <XPDisplay 
                    level={player.level} 
                    experience={player.experience} 
                    showDetailed={false}
                    className="text-amber-100 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Centered title - Now truly centered */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-amber-100 dark:text-amber-50 mb-2 drop-shadow-2xl">🍂 Pumpkin Patch Valley 🍂</h1>
            <p className="text-lg sm:text-xl text-amber-200 dark:text-amber-100 drop-shadow-lg max-w-4xl mx-auto">Grow pumpkins and offer fall flavored goodies to make your Pumpkin Patch the most popular one in the valley!</p>
          </div>
        </div>
      </div>
      {/* Map Container */}
      <div className="relative z-10 mx-auto max-w-6xl h-[600px] px-4">
        <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-amber-600 shadow-2xl">
          
          {/* Background Agriculture Map */}
          <div className="absolute inset-0">
            <img 
              src="/map-background.png" 
              alt="Pumpkin Patch Valley Map"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          
          {/* Interactive overlay for hover effects */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-300 rounded-2xl"></div>

          {/* Interactive Clickable Areas */}
          {mapLocations.map((location) => (
            <div 
              key={location.id}
              className="absolute group cursor-pointer"
              style={{ 
                left: `${location.position.x}%`, 
                top: `${location.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {isLocationUnlocked(location) ? (
                <Link href={location.route}>
                  <div className="relative transform hover:scale-110 transition-all duration-300">
                    {/* Permanent location label - always visible */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold bg-amber-800 bg-opacity-90 px-3 py-1 rounded-full shadow-lg border-2 border-amber-400 whitespace-nowrap">
                      {location.name}
                    </div>
                    
                    {/* Clickable area overlay */}
                    <div className="w-20 h-20 bg-amber-400 bg-opacity-0 hover:bg-opacity-20 rounded-full border-2 border-transparent hover:border-amber-300 transition-all duration-300 flex items-center justify-center">
                      <location.icon className="w-8 h-8 text-amber-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative">
                  {/* Locked location label */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold bg-gray-600 bg-opacity-90 px-3 py-1 rounded-full shadow-lg border-2 border-gray-400 whitespace-nowrap">
                    {location.name}
                  </div>
                  
                  <div className="w-20 h-20 bg-gray-500 bg-opacity-30 rounded-full border-2 border-gray-400 flex items-center justify-center cursor-not-allowed">
                    <location.icon className="w-8 h-8 text-gray-500" />
                  </div>
                  
                  {/* Level requirement label */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs font-semibold bg-black bg-opacity-80 px-2 py-1 rounded-full whitespace-nowrap">
                    Level {location.levelRequired} Required
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer with helper buttons */}
      <div className="relative z-10 text-center mt-8 pb-8">
        <div className="flex justify-center items-center space-x-4 mb-4">
          <div className="text-amber-200 dark:text-amber-100 text-sm">
            Click on buildings to visit different areas of your farm!
          </div>
        </div>
        
        {/* Emergency resource fix button for TestFlight users */}
        {mightNeedInitFix && (
          <div className="flex justify-center flex-col items-center gap-2">
            <Button
              onClick={() => fixInitializationMutation.mutate()}
              disabled={fixInitializationMutation.isPending}
              variant="outline"
              size="sm"
              className="bg-red-900/80 border-red-400 text-red-100 hover:bg-red-800/90 hover:text-white backdrop-blur-sm"
            >
              {fixInitializationMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Restore Starting Resources
            </Button>
            
            <Button
              onClick={() => emergencyResetMutation.mutate()}
              disabled={emergencyResetMutation.isPending}
              variant="outline"
              size="sm"
              className="bg-orange-900/80 border-orange-400 text-orange-100 hover:bg-orange-800/90 hover:text-white backdrop-blur-sm text-xs"
            >
              {emergencyResetMutation.isPending ? (
                <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <span className="w-3 h-3 mr-2">🚨</span>
              )}
              Force Reset (If Above Fails)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
