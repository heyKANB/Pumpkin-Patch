import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Star } from "lucide-react";

interface XPDisplayProps {
  level: number;
  experience: number;
  className?: string;
  showDetailed?: boolean;
}

// Calculate XP required for a specific level (cumulative)
function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    const baseXP = 100;
    const multiplier = Math.pow(1.2, i - 2);
    totalXP += Math.floor(baseXP * multiplier);
  }
  return totalXP;
}

// Calculate XP needed for the next level (incremental)
function getXPForNextLevel(currentLevel: number): number {
  const currentLevelTotal = getXPRequiredForLevel(currentLevel);
  const nextLevelTotal = getXPRequiredForLevel(currentLevel + 1);
  return nextLevelTotal - currentLevelTotal;
}

export function XPDisplay({ level, experience, className = "", showDetailed = true }: XPDisplayProps) {
  const currentLevelXP = getXPRequiredForLevel(level);
  const nextLevelXP = getXPRequiredForLevel(level + 1);
  const xpInCurrentLevel = experience - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);

  if (!showDetailed) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Star className="h-4 w-4 text-amber-500" />
        <span className="font-semibold text-amber-600 dark:text-amber-400">
          Level {level}
        </span>
        <span className="text-sm text-muted-foreground">
          ({experience} XP)
        </span>
      </div>
    );
  }

  return (
    <Card className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-700 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
              Level {level}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {experience} / {nextLevelXP} XP
            </div>
            <div className="text-xs text-muted-foreground">
              Total Experience
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={progressPercent} 
            className="h-2 bg-amber-100 dark:bg-amber-900"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xpInCurrentLevel} / {xpNeededForNext} XP to next level</span>
            <span>{Math.ceil(progressPercent)}% complete</span>
          </div>
        </div>

        {level >= 10 && (
          <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">
                Level 10+ requires tools to advance
              </span>
            </div>
          </div>
        )}

        {showDetailed && (
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-700">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Current Level Required:</span>
                <span className="font-mono">{currentLevelXP} XP</span>
              </div>
              <div className="flex justify-between">
                <span>Next Level Required:</span>
                <span className="font-mono">{nextLevelXP} XP</span>
              </div>
              <div className="flex justify-between font-medium text-amber-600 dark:text-amber-400">
                <span>XP Needed:</span>
                <span className="font-mono">{nextLevelXP - experience} XP</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick reference component for showing XP requirements
export function XPLevelChart({ className = "" }: { className?: string }) {
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          XP Level Requirements
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {levels.map((level) => {
            const xpRequired = getXPRequiredForLevel(level);
            const xpIncrement = level === 1 ? 0 : getXPForNextLevel(level - 1);
            
            return (
              <div key={level} className="flex justify-between items-center py-1 px-2 rounded bg-amber-50 dark:bg-amber-950">
                <span className="font-medium">Level {level}</span>
                <div className="text-right">
                  <div className="font-mono text-sm">{xpRequired} XP total</div>
                  {level > 1 && (
                    <div className="text-xs text-muted-foreground">
                      (+{xpIncrement} XP)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900 rounded text-center">
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Level 11+ requires tools to unlock
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}