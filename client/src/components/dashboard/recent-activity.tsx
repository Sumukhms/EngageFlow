import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail, Calendar, Edit, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsEvent } from "@shared/schema";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  icon: React.ComponentType<any>;
  iconColor: string;
}

export function RecentActivity() {
  const { data: analyticsEvents, isLoading } = useQuery<AnalyticsEvent[]>({
    queryKey: ["/api/analytics/events", { 
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="w-32 h-6" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="w-8 h-8 rounded-full mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Transform analytics events into activity items
  const activities: ActivityItem[] = analyticsEvents?.map(event => {
    const timestamp = new Date(event.timestamp!);
    
    switch (event.eventType) {
      case "registration":
        return {
          id: event.id,
          type: "registration",
          description: `New registration for event`,
          timestamp,
          icon: UserPlus,
          iconColor: "text-primary bg-primary/10",
        };
      case "email_open":
        return {
          id: event.id,
          type: "email_open",
          description: `Email campaign opened`,
          timestamp,
          icon: Mail,
          iconColor: "text-accent bg-accent/10",
        };
      case "email_click":
        return {
          id: event.id,
          type: "email_click",
          description: `Email campaign link clicked`,
          timestamp,
          icon: Mail,
          iconColor: "text-accent bg-accent/10",
        };
      case "attendance":
        return {
          id: event.id,
          type: "attendance",
          description: `Event attended`,
          timestamp,
          icon: Calendar,
          iconColor: "text-chart-4 bg-chart-4/10",
        };
      case "engagement":
        return {
          id: event.id,
          type: "engagement",
          description: `High engagement activity`,
          timestamp,
          icon: Star,
          iconColor: "text-chart-5 bg-chart-5/10",
        };
      default:
        return {
          id: event.id,
          type: "other",
          description: `System activity`,
          timestamp,
          icon: Edit,
          iconColor: "text-secondary bg-secondary/10",
        };
    }
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5) || [];

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <Card data-testid="recent-activity">
      <CardHeader>
        <CardTitle className="text-lg font-heading font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-3"
                data-testid={`activity-${activity.type}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${activity.iconColor}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-4 text-sm text-primary hover:bg-primary/5"
          data-testid="view-all-activity"
        >
          View all activity
        </Button>
      </CardContent>
    </Card>
  );
}
