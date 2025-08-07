import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RewardedAdButtonProps {
  onRewardEarned: () => void;
  disabled?: boolean;
}

export function RewardedAdButton({ onRewardEarned, disabled = false }: RewardedAdButtonProps) {
  const { toast } = useToast();

  const handleShowRewardedAd = () => {
    try {
      // Check if AdSense is available
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        // In a production environment, you would use Google AdMob's rewarded ads
        // For now, we'll simulate the rewarded ad experience
        
        toast({
          title: "Loading Rewarded Ad...",
          description: "Please wait while we load your reward",
        });

        // Simulate ad loading and completion
        setTimeout(() => {
          // Simulate successful ad completion
          onRewardEarned();
          
          toast({
            title: "Reward Earned! 🎉",
            description: "You've earned 50 bonus coins for watching the ad!",
          });
        }, 2000);
        
      } else {
        toast({
          title: "Ads Not Available",
          description: "Rewarded ads are not available right now. Try again later!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Rewarded ad error:', error);
      toast({
        title: "Error",
        description: "Failed to load rewarded ad. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleShowRewardedAd}
      disabled={disabled}
      size="sm"
      className="ml-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white shadow-lg hover:scale-105 transition-all duration-200"
    >
      <Coins className="mr-1 h-3 w-3" />
      Get More Coins
    </Button>
  );
}