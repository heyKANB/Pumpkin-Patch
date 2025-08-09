import { Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Game from "./game";

export default function Farm() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      {/* Header with navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-green-200 dark:border-green-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Map
              </Button>
            </Link>
            <div className="h-6 w-px bg-green-200 dark:bg-green-700"></div>
            <h1 className="text-xl font-semibold text-green-800 dark:text-green-200 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Farm Field
            </h1>
          </div>
        </div>
      </div>

      {/* Farm content - existing game component */}
      <div className="relative">
        <Game />
      </div>
    </div>
  );
}