import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Lightbulb, Laptop, TrendingUp, Users, Brain, Palette } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Attendee } from "@shared/schema";

export function AttendeeInsights() {
  const { data: attendees, isLoading } = useQuery<Attendee[]>({
    queryKey: ["/api/attendees"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="w-40 h-6" />
              <Skeleton className="w-16 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-32 h-3" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="w-8 h-4" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-6 h-6" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="w-8 h-4" />
                </div>
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get top engaged attendees
  const topAttendees = attendees?.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)).slice(0, 4) || [];

  // Calculate interest distribution
  const allInterests = attendees?.flatMap(attendee => attendee.interests || []) || [];
  const interestCounts = allInterests.reduce((acc, interest) => {
    acc[interest] = (acc[interest] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalInterests = allInterests.length;
  const topInterests = Object.entries(interestCounts)
    .map(([interest, count]) => ({
      name: interest,
      count,
      percentage: Math.round((count / totalInterests) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const getInterestIcon = (interest: string) => {
    const lower = interest.toLowerCase();
    if (lower.includes('tech') || lower.includes('innovation')) return Laptop;
    if (lower.includes('market') || lower.includes('sales')) return TrendingUp;
    if (lower.includes('leader') || lower.includes('management')) return Users;
    if (lower.includes('product') || lower.includes('development')) return Brain;
    if (lower.includes('design') || lower.includes('ux')) return Palette;
    return TrendingUp;
  };

  const getInterestColor = (index: number) => {
    const colors = ['text-primary', 'text-accent', 'text-secondary', 'text-chart-4', 'text-chart-5'];
    return colors[index % colors.length];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Engaged Attendees */}
      <Card data-testid="top-attendees">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading font-semibold">
              Top Engaged Attendees
            </CardTitle>
            <Button variant="ghost" size="sm" data-testid="view-all-attendees">
              View all
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {topAttendees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendees yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topAttendees.map((attendee, index) => (
                <div 
                  key={attendee.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  data-testid={`top-attendee-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={`https://images.unsplash.com/photo-${
                        index === 0 ? '1507003211169-0a1dd7228f2d' :
                        index === 1 ? '1573496359142-b8d87734a5a2' :
                        index === 2 ? '1500648767791-00dcc994a43e' :
                        '1580489944761-15a19d654956'
                      }?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                      alt={`${attendee.name} profile`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {attendee.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attendee.company || "Independent"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      <Star className="w-3 h-3 text-chart-5" />
                      <span className="text-sm font-semibold text-foreground">
                        {attendee.engagementScore || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Interest Categories */}
      <Card data-testid="interest-categories">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading font-semibold">
              Interest Categories
            </CardTitle>
            <Button variant="ghost" size="sm">
              <span className="sr-only">More options</span>
              •••
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {topInterests.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No interests data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topInterests.map((interest, index) => {
                const IconComponent = getInterestIcon(interest.name);
                const colorClass = getInterestColor(index);
                
                return (
                  <div key={interest.name} data-testid={`interest-${index}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-4 h-4 ${colorClass}`} />
                        <span className="text-sm font-medium text-foreground">
                          {interest.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {interest.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === 0 ? 'bg-primary' :
                          index === 1 ? 'bg-accent' :
                          index === 2 ? 'bg-secondary' :
                          index === 3 ? 'bg-chart-4' :
                          'bg-chart-5'
                        }`}
                        style={{ width: `${interest.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* AI Insight */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg" data-testid="ai-insight">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">AI Insight</p>
                <p className="text-xs text-muted-foreground">
                  {topInterests.length > 0 
                    ? `${topInterests[0]?.name || 'Tech'} topics show higher engagement. Consider more ${topInterests[0]?.name?.toLowerCase() || 'technology'}-focused content.`
                    : "Add attendee interests to get personalized insights."
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
