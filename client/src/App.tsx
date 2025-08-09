import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Map from "@/pages/map";
import Farm from "@/pages/farm";
import Kitchen from "@/pages/kitchen";
import Marketplace from "@/pages/marketplace";
import Storefront from "@/pages/storefront";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Map} />
      <Route path="/farm" component={Farm} />
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/storefront" component={Storefront} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
