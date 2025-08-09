import { Link } from "wouter";
import { Sprout, ChefHat, ShoppingCart, Store, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MapLocation {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  available: boolean;
  position: { x: number; y: number };
}

const mapLocations: MapLocation[] = [
  {
    id: "farm",
    name: "Farm Field",
    description: "Plant and harvest crops in your pumpkin patch",
    icon: Sprout,
    route: "/farm",
    available: true,
    position: { x: 20, y: 60 }
  },
  {
    id: "kitchen", 
    name: "Kitchen",
    description: "Bake delicious pies from your harvested crops",
    icon: ChefHat,
    route: "/kitchen",
    available: true,
    position: { x: 70, y: 30 }
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy seeds, fertilizer, and sell your produce",
    icon: ShoppingCart,
    route: "/marketplace", 
    available: true,
    position: { x: 50, y: 80 }
  },
  {
    id: "storefront",
    name: "Store Front",
    description: "Coming soon - Special seasonal items",
    icon: Store,
    route: "/storefront",
    available: false,
    position: { x: 80, y: 70 }
  }
];

export default function Map() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-amber-900 to-orange-800 dark:from-slate-900 dark:via-amber-950 dark:to-orange-950 relative overflow-hidden">
      
      {/* Mountain Silhouettes */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 1200 800" className="absolute inset-0 w-full h-full">
          {/* Back mountain layers */}
          <path d="M0,400 L200,200 L400,300 L600,150 L800,250 L1000,180 L1200,220 L1200,800 L0,800 Z" 
                fill="rgba(51, 65, 85, 0.3)" />
          <path d="M0,450 L150,300 L350,350 L550,200 L750,300 L950,250 L1200,280 L1200,800 L0,800 Z" 
                fill="rgba(92, 58, 24, 0.4)" />
          <path d="M0,500 L100,400 L300,420 L500,350 L700,400 L900,370 L1200,390 L1200,800 L0,800 Z" 
                fill="rgba(120, 53, 15, 0.5)" />
        </svg>
      </div>

      {/* Autumn Trees Silhouettes */}
      <div className="absolute inset-0 opacity-20">
        {/* Tree clusters */}
        <div className="absolute bottom-32 left-12 w-16 h-24 bg-amber-700 rounded-t-full"></div>
        <div className="absolute bottom-28 left-16 w-12 h-20 bg-red-800 rounded-t-full"></div>
        <div className="absolute bottom-36 right-20 w-20 h-28 bg-orange-700 rounded-t-full"></div>
        <div className="absolute bottom-32 right-16 w-14 h-22 bg-amber-800 rounded-t-full"></div>
        <div className="absolute bottom-40 left-1/3 w-18 h-26 bg-red-700 rounded-t-full"></div>
        <div className="absolute bottom-32 right-1/4 w-16 h-24 bg-orange-800 rounded-t-full"></div>
      </div>

      {/* Floating autumn leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-2xl animate-pulse">🍂</div>
        <div className="absolute top-40 right-32 text-xl animate-bounce">🍁</div>
        <div className="absolute top-32 left-1/2 text-lg animate-pulse">🍂</div>
        <div className="absolute top-60 right-1/4 text-2xl animate-bounce">🍁</div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 text-center py-8">
        <h1 className="text-5xl font-bold text-amber-100 dark:text-amber-50 mb-2 drop-shadow-2xl">
          🍂 Smokey Mountain Valley 🍂
        </h1>
        <p className="text-xl text-amber-200 dark:text-amber-100 drop-shadow-lg">
          Journey through the autumn harvest lands
        </p>
      </div>

      {/* Map Container */}
      <div className="relative z-10 mx-auto max-w-7xl h-[500px] px-4">
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          
          {/* Mountain Valley Background */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-800 via-green-700 to-amber-600 opacity-60 rounded-3xl"></div>
          
          {/* Winding path through valley */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <path 
              d="M10,80 Q30,60 50,65 Q70,70 90,50" 
              fill="none" 
              stroke="rgba(139, 69, 19, 0.4)" 
              strokeWidth="3"
              strokeDasharray="2,1"
            />
          </svg>

          {/* Location Icons - Farm */}
          <div className="absolute" style={{ left: '15%', top: '75%' }}>
            <div className="group cursor-pointer">
              <Link href="/farm">
                <div className="relative">
                  {/* Farm Building */}
                  <div className="w-24 h-20 bg-red-700 rounded-t-lg relative transform hover:scale-110 transition-all duration-300 shadow-2xl">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-12 border-r-12 border-b-8 border-transparent border-b-red-800"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-6 bg-yellow-300 rounded"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-6 bg-yellow-300 rounded"></div>
                  </div>
                  {/* Farm fields */}
                  <div className="absolute -bottom-4 -left-2 w-8 h-8 bg-amber-600 rounded opacity-80"></div>
                  <div className="absolute -bottom-4 -right-2 w-8 h-8 bg-green-600 rounded opacity-80"></div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Farm Field
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Location Icons - Kitchen */}
          <div className="absolute" style={{ left: '70%', top: '25%' }}>
            <div className="group cursor-pointer">
              <Link href="/kitchen">
                <div className="relative">
                  {/* Kitchen Building */}
                  <div className="w-24 h-20 bg-amber-700 rounded-t-lg relative transform hover:scale-110 transition-all duration-300 shadow-2xl">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-12 border-r-12 border-b-8 border-transparent border-b-amber-800"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-6 bg-orange-400 rounded"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-6 bg-orange-400 rounded"></div>
                    {/* Chimney smoke */}
                    <div className="absolute -top-6 right-2 w-2 h-4 bg-gray-600"></div>
                    <div className="absolute -top-10 right-1 text-white opacity-60">💨</div>
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Kitchen
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Location Icons - Marketplace */}
          <div className="absolute" style={{ left: '50%', top: '65%' }}>
            <div className="group cursor-pointer">
              <Link href="/marketplace">
                <div className="relative">
                  {/* Market Stalls */}
                  <div className="w-24 h-16 relative transform hover:scale-110 transition-all duration-300">
                    <div className="w-8 h-12 bg-green-700 rounded-t-lg mr-1 inline-block shadow-xl"></div>
                    <div className="w-8 h-12 bg-blue-700 rounded-t-lg mr-1 inline-block shadow-xl"></div>
                    <div className="w-8 h-12 bg-purple-700 rounded-t-lg inline-block shadow-xl"></div>
                    {/* Market goods */}
                    <div className="absolute bottom-0 left-1 text-xs">🎃</div>
                    <div className="absolute bottom-0 left-9 text-xs">🌱</div>
                    <div className="absolute bottom-0 left-17 text-xs">🍎</div>
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Marketplace
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Location Icons - Store Front (Coming Soon) */}
          <div className="absolute" style={{ left: '80%', top: '60%' }}>
            <div className="group cursor-not-allowed">
              <div className="relative opacity-60">
                {/* Store Building */}
                <div className="w-24 h-20 bg-purple-700 rounded-t-lg relative shadow-2xl">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-12 border-r-12 border-b-8 border-transparent border-b-purple-800"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-6 bg-gray-400 rounded"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-6 bg-gray-400 rounded"></div>
                  {/* "CLOSED" sign */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 text-white text-xs px-1 py-0.5 rounded transform rotate-12">
                      CLOSED
                    </div>
                  </div>
                </div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-semibold bg-black bg-opacity-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Store Front (Coming Soon)
                </div>
              </div>
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