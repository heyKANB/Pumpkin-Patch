import { Link } from "wouter";
import { Sprout, ChefHat, ShoppingCart, Store, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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
    position: { x: 15, y: 75 }  // Bottom left - main farming area
  },
  {
    id: "kitchen", 
    name: "Kitchen",
    description: "Bake delicious pies from your harvested crops",
    icon: ChefHat,
    route: "/kitchen",
    available: true,
    position: { x: 75, y: 25 },  // Top right - elevated kitchen area
    levelRequired: 2
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy seeds, fertilizer, and sell your produce",
    icon: ShoppingCart,
    route: "/marketplace", 
    available: true,
    position: { x: 25, y: 25 }  // Top left - market square area
  },
  {
    id: "storefront",
    name: "Store Front",
    description: "Coming soon - Special seasonal items",
    icon: Store,
    route: "/storefront",
    available: false,
    position: { x: 75, y: 75 }  // Bottom right - commercial district
  }
];

export default function Map() {
  const { data: player } = useQuery<Player>({
    queryKey: ["/api/player", PLAYER_ID],
  });

  const isLocationUnlocked = (location: MapLocation): boolean => {
    if (!location.levelRequired) return location.available;
    if (!player) return false;
    return player.level >= location.levelRequired && location.available;
  };
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
      <div className="relative z-10 mx-auto max-w-7xl h-[500px] px-4">
        <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-amber-600 shadow-2xl">
          
          {/* Valley floor with realistic terrain */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-amber-700 to-green-800 rounded-3xl"></div>
          
          {/* Terrain texture overlay */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <defs>
                <pattern id="grass" patternUnits="userSpaceOnUse" width="20" height="20">
                  <rect width="20" height="20" fill="rgba(34, 197, 94, 0.1)"/>
                  <circle cx="5" cy="5" r="1" fill="rgba(22, 163, 74, 0.3)"/>
                  <circle cx="15" cy="10" r="0.8" fill="rgba(22, 163, 74, 0.3)"/>
                  <circle cx="10" cy="15" r="1.2" fill="rgba(22, 163, 74, 0.3)"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grass)"/>
            </svg>
          </div>
          
          {/* River flowing through valley */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="riverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)"/>
                <stop offset="50%" stopColor="rgba(147, 197, 253, 0.5)"/>
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)"/>
              </linearGradient>
            </defs>
            <path 
              d="M5,85 Q20,70 35,75 Q50,80 65,70 Q80,60 95,65" 
              fill="none" 
              stroke="url(#riverGradient)" 
              strokeWidth="4"
              opacity="0.8"
            />
          </svg>
          
          {/* Winding dirt paths connecting all locations */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Main path: Farm (15,75) to Marketplace (25,25) */}
            <path 
              d="M15,75 Q20,50 25,25" 
              fill="none" 
              stroke="rgba(139, 69, 19, 0.6)" 
              strokeWidth="2.5"
              strokeDasharray="1,0.5"
            />
            {/* Path: Marketplace (25,25) to Kitchen (75,25) */}
            <path 
              d="M25,25 Q50,20 75,25" 
              fill="none" 
              stroke="rgba(139, 69, 19, 0.5)" 
              strokeWidth="2"
              strokeDasharray="1,0.5"
            />
            {/* Path: Kitchen (75,25) to Store Front (75,75) */}
            <path 
              d="M75,25 Q80,50 75,75" 
              fill="none" 
              stroke="rgba(139, 69, 19, 0.4)" 
              strokeWidth="1.8"
              strokeDasharray="1,0.5"
            />
            {/* Path: Farm (15,75) to Store Front (75,75) */}
            <path 
              d="M15,75 Q45,80 75,75" 
              fill="none" 
              stroke="rgba(139, 69, 19, 0.3)" 
              strokeWidth="1.5"
              strokeDasharray="1,0.5"
            />
            {/* Central crossroads */}
            <path 
              d="M25,25 Q45,45 75,75" 
              fill="none" 
              stroke="rgba(139, 69, 19, 0.3)" 
              strokeWidth="1.2"
              strokeDasharray="1,0.5"
            />
          </svg>
          
          {/* Scattered rocks and boulders */}
          <div className="absolute bottom-20 left-12 w-4 h-3 bg-gray-600 rounded-full opacity-60"></div>
          <div className="absolute bottom-32 left-20 w-3 h-2 bg-gray-500 rounded-full opacity-50"></div>
          <div className="absolute bottom-16 right-16 w-5 h-4 bg-gray-700 rounded-full opacity-70"></div>
          <div className="absolute top-1/3 left-1/4 w-3 h-2 bg-gray-600 rounded-full opacity-40"></div>
          <div className="absolute top-2/3 right-1/3 w-4 h-3 bg-gray-500 rounded-full opacity-60"></div>

          {/* Location Icons - Farm */}
          <div className="absolute" style={{ left: '15%', top: '75%' }}>
            <div className="group cursor-pointer">
              <Link href="/farm">
                <div className="relative transform hover:scale-105 transition-all duration-300">
                  {/* Farm Building Complex */}
                  <div className="relative">
                    {/* Main barn */}
                    <div className="w-28 h-24 bg-red-700 rounded-t-lg relative shadow-2xl border-2 border-red-800">
                      {/* Roof */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-transparent border-b-red-900"></div>
                      {/* Barn doors */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-amber-900 rounded-t-lg"></div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-amber-800"></div>
                      {/* Windows */}
                      <div className="absolute top-4 left-2 w-4 h-4 bg-yellow-300 rounded border border-yellow-600"></div>
                      <div className="absolute top-4 right-2 w-4 h-4 bg-yellow-300 rounded border border-yellow-600"></div>
                      {/* Weather vane */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-gray-700"></div>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-yellow-500 text-xs">⭐</div>
                    </div>
                    
                    {/* Silo */}
                    <div className="absolute -right-4 top-2 w-8 h-20 bg-gray-400 rounded-t-full shadow-lg border border-gray-500">
                      <div className="absolute top-0 w-full h-2 bg-gray-300 rounded-t-full"></div>
                    </div>
                    
                    {/* Farm fields */}
                    <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-amber-600 rounded opacity-90 shadow-md">
                      <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
                        <div className="bg-green-700 rounded-sm"></div>
                        <div className="bg-amber-700 rounded-sm"></div>
                        <div className="bg-green-700 rounded-sm"></div>
                        <div className="bg-amber-700 rounded-sm"></div>
                        <div className="bg-green-700 rounded-sm"></div>
                        <div className="bg-amber-700 rounded-sm"></div>
                        <div className="bg-green-700 rounded-sm"></div>
                        <div className="bg-amber-700 rounded-sm"></div>
                        <div className="bg-green-700 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="absolute -bottom-6 -right-8 w-12 h-12 bg-green-600 rounded opacity-90 shadow-md">
                      <div className="absolute inset-1 grid grid-cols-3 gap-0.5">
                        <div className="bg-orange-700 rounded-sm"></div>
                        <div className="bg-green-800 rounded-sm"></div>
                        <div className="bg-orange-700 rounded-sm"></div>
                        <div className="bg-green-800 rounded-sm"></div>
                        <div className="bg-orange-700 rounded-sm"></div>
                        <div className="bg-green-800 rounded-sm"></div>
                        <div className="bg-orange-700 rounded-sm"></div>
                        <div className="bg-green-800 rounded-sm"></div>
                        <div className="bg-orange-700 rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* Fence */}
                    <div className="absolute -bottom-2 left-0 right-0 h-2 bg-amber-800 opacity-60 rounded"></div>
                    
                    {/* Label */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-70 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-600">Farm</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Location Icons - Kitchen */}
          <div className="absolute" style={{ left: '75%', top: '25%' }}>
            <div className={`group ${isLocationUnlocked(mapLocations[1]) ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              {isLocationUnlocked(mapLocations[1]) ? (
                <Link href="/kitchen">
                  <div className="relative transform hover:scale-105 transition-all duration-300">
                    {/* Kitchen Building Complex */}
                    <div className="relative">
                      {/* Main kitchen house */}
                      <div className="w-28 h-24 bg-amber-700 rounded-t-lg relative shadow-2xl border-2 border-amber-800">
                        {/* Roof with shingles */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-transparent border-b-amber-900"></div>
                        <div className="absolute -top-1 left-2 right-2 h-4 bg-amber-800 rounded-t-lg opacity-80"></div>
                        
                        {/* Windows with warm glow */}
                        <div className="absolute top-4 left-3 w-5 h-5 bg-orange-300 rounded border-2 border-orange-600 shadow-inner">
                          <div className="absolute inset-0.5 bg-yellow-200 rounded opacity-80"></div>
                        </div>
                        <div className="absolute top-4 right-3 w-5 h-5 bg-orange-300 rounded border-2 border-orange-600 shadow-inner">
                          <div className="absolute inset-0.5 bg-yellow-200 rounded opacity-80"></div>
                        </div>
                        
                        {/* Door */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-orange-900 rounded-t-lg border border-orange-800">
                          <div className="absolute top-4 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                        </div>
                        
                        {/* Chimney with detailed smoke */}
                        <div className="absolute -top-8 right-3 w-3 h-8 bg-gray-700 shadow-lg rounded-t-sm border border-gray-800"></div>
                        <div className="absolute -top-12 right-2 text-lg opacity-80 animate-pulse">💨</div>
                        <div className="absolute -top-14 right-1 text-sm opacity-60 animate-pulse">💨</div>
                        <div className="absolute -top-16 right-3 text-xs opacity-40 animate-pulse">💨</div>
                      </div>
                      
                      {/* Outdoor brick oven */}
                      <div className="absolute -left-6 bottom-2 w-10 h-8 bg-red-800 rounded-t-full shadow-lg border border-red-900">
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-black rounded-t-lg opacity-60"></div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs opacity-60">🔥</div>
                      </div>
                      
                      {/* Kitchen garden */}
                      <div className="absolute -right-8 bottom-0 w-10 h-8 bg-green-700 rounded shadow-md">
                        <div className="absolute inset-1 text-xs opacity-80">🌿</div>
                        <div className="absolute top-1 right-1 text-xs">🍅</div>
                        <div className="absolute bottom-1 left-1 text-xs">🥕</div>
                      </div>
                      
                      {/* Label */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-70 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-600">
                        🍳 Kitchen
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative transform hover:scale-105 transition-all duration-300 opacity-60">
                  {/* Kitchen Building Complex */}
                  <div className="relative">
                    {/* Main kitchen house */}
                    <div className="w-28 h-24 bg-amber-700 rounded-t-lg relative shadow-2xl border-2 border-amber-800">
                      {/* Roof with shingles */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-transparent border-b-amber-900"></div>
                      <div className="absolute -top-1 left-2 right-2 h-4 bg-amber-800 rounded-t-lg opacity-80"></div>
                      
                      {/* Windows with warm glow */}
                      <div className="absolute top-4 left-3 w-5 h-5 bg-orange-300 rounded border-2 border-orange-600 shadow-inner">
                        <div className="absolute inset-0.5 bg-yellow-200 rounded opacity-80"></div>
                      </div>
                      <div className="absolute top-4 right-3 w-5 h-5 bg-orange-300 rounded border-2 border-orange-600 shadow-inner">
                        <div className="absolute inset-0.5 bg-yellow-200 rounded opacity-80"></div>
                      </div>
                      
                      {/* Door */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-orange-900 rounded-t-lg border border-orange-800">
                        <div className="absolute top-4 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                      </div>
                      
                      {/* Chimney with detailed smoke */}
                      <div className="absolute -top-8 right-3 w-3 h-8 bg-gray-700 shadow-lg rounded-t-sm border border-gray-800"></div>
                      <div className="absolute -top-12 right-2 text-lg opacity-80 animate-pulse">💨</div>
                      <div className="absolute -top-14 right-1 text-sm opacity-60 animate-pulse">💨</div>
                      <div className="absolute -top-16 right-3 text-xs opacity-40 animate-pulse">💨</div>
                    </div>
                    
                    {/* Outdoor brick oven */}
                    <div className="absolute -left-6 bottom-2 w-10 h-8 bg-red-800 rounded-t-full shadow-lg border border-red-900">
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-black rounded-t-lg opacity-60"></div>
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs opacity-60">🔥</div>
                    </div>
                    
                    {/* Kitchen garden */}
                    <div className="absolute -right-8 bottom-0 w-10 h-8 bg-green-700 rounded shadow-md">
                      <div className="absolute inset-1 text-xs opacity-80">🌿</div>
                      <div className="absolute top-1 right-1 text-xs">🍅</div>
                      <div className="absolute bottom-1 left-1 text-xs">🥕</div>
                    </div>
                    
                    {/* Label */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-70 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-600">
                      🍳 Kitchen (Level 2 Required)
                    </div>
                    
                    {/* Lock overlay for level 1 players */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-t-lg">
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg transform rotate-12 border border-red-700">
                        🔒 LEVEL 2
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Icons - Marketplace */}
          <div className="absolute" style={{ left: '25%', top: '25%' }}>
            <div className="group cursor-pointer">
              <Link href="/marketplace">
                <div className="relative transform hover:scale-105 transition-all duration-300">
                  {/* Market Square */}
                  <div className="relative">
                    {/* Market stalls with awnings */}
                    <div className="flex space-x-1">
                      {/* Produce stall */}
                      <div className="relative">
                        <div className="w-10 h-14 bg-green-700 rounded-t-lg shadow-xl border border-green-800">
                          {/* Awning */}
                          <div className="absolute -top-2 left-0 right-0 h-3 bg-green-500 rounded-t-lg shadow-sm"></div>
                          {/* Display table */}
                          <div className="absolute bottom-1 left-1 right-1 h-3 bg-amber-600 rounded"></div>
                          {/* Products */}
                          <div className="absolute bottom-2 left-1 text-xs">🎃</div>
                          <div className="absolute bottom-2 right-1 text-xs">🍎</div>
                        </div>
                      </div>
                      
                      {/* Seeds & tools stall */}
                      <div className="relative">
                        <div className="w-10 h-14 bg-blue-700 rounded-t-lg shadow-xl border border-blue-800">
                          {/* Awning */}
                          <div className="absolute -top-2 left-0 right-0 h-3 bg-blue-500 rounded-t-lg shadow-sm"></div>
                          {/* Display table */}
                          <div className="absolute bottom-1 left-1 right-1 h-3 bg-amber-600 rounded"></div>
                          {/* Products */}
                          <div className="absolute bottom-2 left-1 text-xs">🌱</div>
                          <div className="absolute bottom-2 right-1 text-xs">🛠️</div>
                        </div>
                      </div>
                      
                      {/* General goods stall */}
                      <div className="relative">
                        <div className="w-10 h-14 bg-purple-700 rounded-t-lg shadow-xl border border-purple-800">
                          {/* Awning */}
                          <div className="absolute -top-2 left-0 right-0 h-3 bg-purple-500 rounded-t-lg shadow-sm"></div>
                          {/* Display table */}
                          <div className="absolute bottom-1 left-1 right-1 h-3 bg-amber-600 rounded"></div>
                          {/* Products */}
                          <div className="absolute bottom-2 left-1 text-xs">🥧</div>
                          <div className="absolute bottom-2 right-1 text-xs">💰</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Market fountain/center */}
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full shadow-md border border-stone-600">
                      <div className="absolute inset-1 bg-blue-200 rounded-full opacity-80"></div>
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs opacity-60">💧</div>
                    </div>
                    
                    {/* Market pennants */}
                    <div className="absolute -top-4 left-0 w-1 h-8 bg-amber-600"></div>
                    <div className="absolute -top-6 left-0 text-xs">🏳️</div>
                    <div className="absolute -top-4 right-0 w-1 h-8 bg-amber-600"></div>
                    <div className="absolute -top-6 right-0 text-xs">🏳️</div>
                    
                    {/* Label */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-70 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-600">
                      🛒 Marketplace
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Location Icons - Store Front */}
          <div className="absolute" style={{ left: '75%', top: '75%' }}>
            <div className="group cursor-pointer">
              <Link href="/storefront">
                <div className="relative transform hover:scale-105 transition-all duration-300">
                  {/* Store Building - Victorian style */}
                  <div className="relative">
                    <div className="w-28 h-24 bg-orange-700 rounded-t-lg relative shadow-2xl border-2 border-orange-800">
                      {/* Fancy roof */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[15px] border-transparent border-b-orange-900"></div>
                      <div className="absolute -top-2 left-3 right-3 h-5 bg-orange-800 rounded-t-lg"></div>
                      
                      {/* Storefront windows (bright and welcoming) */}
                      <div className="absolute top-4 left-2 w-6 h-6 bg-yellow-300 rounded border-2 border-yellow-600 shadow-inner">
                        <div className="absolute inset-0.5 bg-orange-200 rounded opacity-80"></div>
                        <div className="absolute top-1 left-1 text-xs">🛍️</div>
                      </div>
                      <div className="absolute top-4 right-2 w-6 h-6 bg-yellow-300 rounded border-2 border-yellow-600 shadow-inner">
                        <div className="absolute inset-0.5 bg-orange-200 rounded opacity-80"></div>
                        <div className="absolute top-1 left-1 text-xs">🏪</div>
                      </div>
                      
                      {/* Store door (open and inviting) */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-14 bg-amber-900 rounded-t-lg border-2 border-amber-800">
                        <div className="absolute top-2 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                        <div className="absolute inset-2 bg-amber-700 rounded-t-lg opacity-80"></div>
                        <div className="absolute bottom-0 left-1 right-1 h-2 bg-yellow-200 opacity-60"></div>
                      </div>
                      
                      {/* "OPEN" sign */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg border border-green-600 animate-pulse">
                          OPEN
                        </div>
                      </div>
                      
                      {/* Store awning */}
                      <div className="absolute top-10 left-1 right-1 h-3 bg-orange-600 rounded shadow-md border border-orange-700">
                        <div className="absolute inset-x-1 top-0.5 h-1 bg-orange-500 rounded opacity-80"></div>
                      </div>
                      
                      {/* Customer activity indicators */}
                      <div className="absolute -bottom-4 -left-2 text-sm animate-bounce opacity-80">👨‍🌾</div>
                      <div className="absolute -bottom-4 -right-2 text-sm animate-pulse opacity-70">👩‍🍳</div>
                      
                      {/* Store goods display */}
                      <div className="absolute bottom-2 left-3 text-xs opacity-90">🎃</div>
                      <div className="absolute bottom-2 right-3 text-xs opacity-90">🥧</div>
                    </div>
                    
                    {/* Store sign post */}
                    <div className="absolute -right-6 top-2 w-1 h-16 bg-amber-800 shadow-sm"></div>
                    <div className="absolute -right-10 top-0 bg-orange-600 text-white text-xs px-2 py-1 rounded shadow-lg border border-orange-700 transform rotate-6">
                      Orders!
                    </div>
                    
                    {/* Label */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-70 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-600">
                      🏪 Store Front
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Weather effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 text-3xl animate-bounce opacity-70">☁️</div>
            <div className="absolute top-16 right-20 text-2xl animate-pulse opacity-60">☁️</div>
          </div>
        </div>
      </div>
      {/* Valley footer */}
      <div className="relative z-10 text-center mt-8 pb-8">
        <p className="text-lg text-amber-200 dark:text-amber-100 drop-shadow-lg">
          🏔️ Explore the autumn harvest valley and build your farming empire 🏔️
        </p>
      </div>
    </div>
  );
}