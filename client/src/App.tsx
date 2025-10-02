import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { OnboardingTour } from "@/components/walkthrough/onboarding-tour";
import Dashboard from "@/pages/dashboard";
import Events from "@/pages/events";
import Attendees from "@/pages/attendees";
import Campaigns from "@/pages/campaigns";
import Analytics from "@/pages/analytics";
import Templates from "@/pages/templates";
import PublicRegister from "@/pages/public-register";
import NotFound from "@/pages/not-found";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/events" component={Events} />
      <Route path="/attendees" component={Attendees} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/templates" component={Templates} />
      <Route path="/register" component={PublicRegister} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem("onboarding-tour-completed");
    if (!hasCompletedTour) {
      setTimeout(() => setShowTour(true), 500);
    }
  }, []);

  const handleTourComplete = () => {
    localStorage.setItem("onboarding-tour-completed", "true");
    setShowTour(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
          <main className="flex-1 overflow-y-auto">
            <Header 
              onMenuClick={() => setSidebarOpen(true)}
              showMenuButton={isMobile}
            />
            <div className="p-6">
              <Router />
            </div>
          </main>
        </div>
        {showTour && <OnboardingTour onComplete={handleTourComplete} />}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
