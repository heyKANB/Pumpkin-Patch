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

  if (!canCollect && hoursUntilNext) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className="w-full bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
      >
        <Clock className="w-4 h-4 mr-2" />
        Next daily coins: {hoursUntilNext}h
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCollect}
      disabled={!canCollect || isCollecting || collectDailyCoins.isPending}
      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
    >
      <Coins className="w-4 h-4 mr-2" />
      {isCollecting || collectDailyCoins.isPending ? "Collecting..." : "Collect 5 Daily Coins"}
    </Button>
  );
}