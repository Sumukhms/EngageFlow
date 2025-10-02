import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  CalendarCheck,
  Users,
  Mail,
  BarChart3,
  FileText,
  Settings,
  Plug,
  Home,
  Globe
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Events", href: "/events", icon: Calendar, badge: "3" },
  { name: "Attendees", href: "/attendees", icon: Users },
  { name: "Email Campaigns", href: "/campaigns", icon: Mail },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Public Registration", href: "/register", icon: Globe },
];

const settingsNavigation = [
  { name: "Preferences", href: "/preferences", icon: Settings },
  { name: "Integrations", href: "/integrations", icon: Plug },
];

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-backdrop"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 sidebar-transition z-50",
          isMobile ? "fixed h-full" : "static",
          isMobile && !isOpen && "sidebar-hidden"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-sidebar-foreground">
                  EventBoost
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Engagement Platform
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={isMobile ? onClose : undefined}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="px-4 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-2">
                Settings
              </p>
              {settingsNavigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={isMobile ? onClose : undefined}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                alt="Sarah Johnson profile" 
                className="w-10 h-10 rounded-full object-cover"
                data-testid="user-avatar"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  Sarah Johnson
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  Event Organizer
                </p>
              </div>
              <div className="w-4 h-4 text-sidebar-foreground/60" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
