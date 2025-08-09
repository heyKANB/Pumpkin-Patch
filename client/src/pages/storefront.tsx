import { Link } from "wouter";
import { ArrowLeft, Store, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Storefront() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-950">
      {/* Header with navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-purple-200 dark:border-purple-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Map
              </Button>
            </Link>
            <div className="h-6 w-px bg-purple-200 dark:bg-purple-700"></div>
            <h1 className="text-xl font-semibold text-purple-800 dark:text-purple-200 flex items-center">
              <Store className="w-5 h-5 mr-2" />
              Store Front
            </h1>
          </div>
        </div>
      </div>

      {/* Coming Soon content */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 border border-purple-200 dark:border-purple-700">
          
          {/* Coming Soon Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Store className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-4xl font-bold text-purple-800 dark:text-purple-200 mb-4">
            Store Front
          </h2>
          
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </div>
          
          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We're working hard to bring you an amazing store experience! Soon you'll be able to purchase 
            special seasonal items, rare decorations, and exclusive upgrades for your farm.
          </p>
          
          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-purple-50 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700">
              <CardHeader className="text-center pb-3">
                <div className="text-3xl mb-2">🎃</div>
                <CardTitle className="text-sm text-purple-800 dark:text-purple-200">
                  Seasonal Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Special decorations and themed items for each season
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700">
              <CardHeader className="text-center pb-3">
                <div className="text-3xl mb-2">⭐</div>
                <CardTitle className="text-sm text-purple-800 dark:text-purple-200">
                  Premium Upgrades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Exclusive tools and upgrades to boost your productivity
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 dark:bg-purple-900/50 border-purple-200 dark:border-purple-700">
              <CardHeader className="text-center pb-3">
                <div className="text-3xl mb-2">🏆</div>
                <CardTitle className="text-sm text-purple-800 dark:text-purple-200">
                  Rare Collectibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Limited edition items and achievement rewards
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Map
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                <Store className="w-4 h-4 mr-2" />
                Visit Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}