import { Link } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Game from "./game";

export default function Farm() {
  return (
    <div className="min-h-screen">
      {/* Game component with integrated navigation */}
      <Game showNavigation={true} />
    </div>
  );
}