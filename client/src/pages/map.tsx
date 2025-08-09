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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-300 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-amber-300 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-red-300 rounded-full"></div>
        <div className="absolute bottom-40 right-1/3 w-18 h-18 bg-yellow-300 rounded-full"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 text-center py-8">
        <h1 className="text-4xl font-bold text-orange-800 dark:text-orange-200 mb-2">
          Pumpkin Patch Map
        </h1>
        <p className="text-lg text-orange-600 dark:text-orange-300">
          Choose your destination to continue your farming adventure
        </p>
      </div>

      {/* Map Container */}
      <div className="relative z-10 mx-auto max-w-6xl h-96 px-4">
        <div className="relative w-full h-full bg-green-100 dark:bg-green-900 rounded-3xl border-4 border-orange-300 dark:border-orange-700 shadow-2xl overflow-hidden">
          
          {/* Map background pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Map locations */}
          {mapLocations.map((location) => {
            const IconComponent = location.icon;
            return (
              <div
                key={location.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${location.position.x}%`,
                  top: `${location.position.y}%`
                }}
              >
                <Card className={`w-40 transition-all duration-300 hover:scale-110 ${
                  location.available 
                    ? "bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl cursor-pointer" 
                    : "bg-gray-200 dark:bg-gray-700 opacity-60 cursor-not-allowed"
                }`}>
                  <CardContent className="p-3 text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      location.available 
                        ? "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300" 
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500"
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <h3 className={`font-semibold text-sm mb-1 ${
                      location.available 
                        ? "text-gray-800 dark:text-gray-200" 
                        : "text-gray-500"
                    }`}>
                      {location.name}
                    </h3>
                    
                    <p className={`text-xs mb-3 ${
                      location.available 
                        ? "text-gray-600 dark:text-gray-400" 
                        : "text-gray-400"
                    }`}>
                      {location.description}
                    </p>
                    
                    {location.available ? (
                      <Link href={location.route}>
                        <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                          <MapPin className="w-3 h-3 mr-1" />
                          Visit
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" className="w-full" disabled>
                        Coming Soon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick stats footer */}
      <div className="relative z-10 text-center mt-8 pb-8">
        <p className="text-sm text-orange-600 dark:text-orange-400">
          Navigate between locations to manage your farming empire
        </p>
      </div>
    </div>
  );
}