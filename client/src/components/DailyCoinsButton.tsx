import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Coins, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyCoinsButtonProps {
  playerId: string;
  canCollect: boolean;
  hoursUntilNext?: number;
}

export function DailyCoinsButton({ playerId, canCollect, hoursUntilNext }: DailyCoinsButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCollecting, setIsCollecting] = useState(false);

  // Enhanced logging for TestFlight debugging
  console.log('🪙 DailyCoinsButton: Rendered with props:', { 
    playerId, 
    canCollect, 
    hoursUntilNext,
    currentTime: new Date().toISOString()
  });

  const collectDailyCoins = useMutation({
    mutationFn: async () => {
      console.log('🪙 Attempting to collect daily coins for player:', playerId);
      try {
        const response = await apiRequest("POST", "/api/collect-daily-coins", { playerId });
        console.log('🪙 Daily coins collection response:', response);
        return response;
      } catch (error) {
        console.error('🪙 Daily coins collection error:', error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      console.log('🪙 Daily coins collected successfully:', data);
      toast({
        title: "Daily Coins Collected!",
        description: `You received ${data.coinsReceived} coins!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
      setIsCollecting(false);
    },
    onError: (error: any) => {
      console.error('🪙 Daily coins collection failed:', error);
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      toast({
        title: "Collection Failed",
        description: `Error: ${errorMessage}. Check console for details.`,
        variant: "destructive",
      });
      setIsCollecting(false);
    }
  });

  // TestFlight debugging mutation to reset daily coins timer
  const resetDailyCoins = useMutation({
    mutationFn: async () => {
      console.log('🛠️ TestFlight: Resetting daily coins timer for player:', playerId);
      const response = await apiRequest("POST", `/api/debug/reset-daily-coins/${playerId}`, {});
      return response;
    },
    onSuccess: (data: any) => {
      console.log('🛠️ TestFlight: Daily coins timer reset successfully:', data);
      toast({
        title: "Timer Reset!",
        description: "Daily coins timer has been reset for testing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/player", playerId] });
    },
    onError: (error: any) => {
      console.error('🛠️ TestFlight: Reset failed:', error);
      toast({
        title: "Reset Failed",
        description: "Could not reset daily coins timer.",
        variant: "destructive",
      });
    }
  });

  const handleCollect = () => {
    console.log('🪙 Handle collect called - canCollect:', canCollect, 'isCollecting:', isCollecting);
    if (!canCollect || isCollecting) {
      console.log('🪙 Collection blocked - canCollect:', canCollect, 'isCollecting:', isCollecting);
      return;
    }
    setIsCollecting(true);
    console.log('🪙 Starting daily coins collection...');
    collectDailyCoins.mutate();
  };

  // TestFlight debugging - long press to reset timer
  const handleLongPress = () => {
    if (!canCollect && hoursUntilNext) {
      console.log('🛠️ TestFlight: Long press detected - resetting daily coins timer');
      resetDailyCoins.mutate();
    }
  };

  if (!canCollect && hoursUntilNext) {
    return (
      <div className="w-full">
        <Button 
          variant="outline" 
          disabled 
          className="w-full bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
        >
          <Clock className="w-4 h-4 mr-2" />
          Next daily coins: {hoursUntilNext}h
        </Button>
        
        {/* TestFlight Debug Button */}
        <Button 
          onClick={handleLongPress}
          disabled={resetDailyCoins.isPending}
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-xs text-gray-500 hover:text-gray-700 h-6"
        >
          {resetDailyCoins.isPending ? "Resetting..." : "🛠️ TestFlight: Tap to Reset Timer"}
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleCollect}
      onTouchStart={handleCollect}
      disabled={!canCollect || isCollecting || collectDailyCoins.isPending}
      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white active:bg-yellow-700 select-none"
      style={{ 
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      <Coins className="w-4 h-4 mr-2" />
      {isCollecting || collectDailyCoins.isPending ? "Collecting..." : "Collect 5 Daily Coins"}
    </Button>
  );
}