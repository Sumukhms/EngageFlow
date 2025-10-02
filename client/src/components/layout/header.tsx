import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

const pageConfig = {
  "/": {
    title: "Dashboard",
    description: "Welcome back! Here's your event overview"
  },
  "/events": {
    title: "Events",
    description: "Manage your events and webinars"
  },
  "/attendees": {
    title: "Attendees",
    description: "View and manage event attendees"
  },
  "/campaigns": {
    title: "Email Campaigns",
    description: "Create and manage your email campaigns"
  },
  "/analytics": {
    title: "Analytics",
    description: "View your engagement metrics and insights"
  },
  "/templates": {
    title: "Templates",
    description: "Manage your email templates"
  },
};

export function Header({ onMenuClick, showMenuButton }: HeaderProps) {
  const [location] = useLocation();
  const config = pageConfig[location as keyof typeof pageConfig] || pageConfig["/"];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              data-testid="menu-button"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">
              {config.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center bg-muted rounded-lg px-4 py-2 w-64">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <Input
              type="text"
              placeholder="Search events, attendees..."
              className="bg-transparent border-none outline-none text-sm w-full p-0 h-auto focus-visible:ring-0"
              data-testid="search-input"
            />
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            data-testid="notifications-button"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          
          {/* Quick Actions */}
          <Button className="flex items-center space-x-2" data-testid="new-event-button">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Event</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
