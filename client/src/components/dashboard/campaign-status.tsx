import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmailCampaign } from "@shared/schema";

export function CampaignStatus() {
  const { data: campaigns, isLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: campaignStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/campaigns", "stats"],
    queryFn: async () => {
      if (!campaigns) return {};
      
      const stats: Record<string, any> = {};
      
      // Get stats for each active campaign
      for (const campaign of campaigns.slice(0, 2)) {
        try {
          const response = await fetch(`/api/campaigns/${campaign.id}/stats`);
          if (response.ok) {
            stats[campaign.id] = await response.json();
          }
        } catch (error) {
          console.error(`Failed to fetch stats for campaign ${campaign.id}:`, error);
        }
      }
      
      return stats;
    },
    enabled: !!campaigns && campaigns.length > 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-6 h-6" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <Skeleton className="w-16 h-5" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="text-center space-y-1">
                    <Skeleton className="w-8 h-5 mx-auto" />
                    <Skeleton className="w-10 h-3 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Get active campaigns (scheduled, sending, or recently sent)
  const activeCampaigns = campaigns?.filter(campaign => 
    campaign.status === "scheduled" || 
    campaign.status === "sending" || 
    (campaign.status === "sent" && campaign.sentAt && 
     new Date(campaign.sentAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  ).slice(0, 2) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-chart-4 text-white";
      case "sending": return "bg-accent text-accent-foreground";
      case "scheduled": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getNextScheduled = (campaign: EmailCampaign) => {
    if (campaign.scheduledAt) {
      const scheduledDate = new Date(campaign.scheduledAt);
      const now = new Date();
      const timeDiff = scheduledDate.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else {
          return `${minutes}m`;
        }
      }
    }
    return null;
  };

  return (
    <Card data-testid="campaign-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading font-semibold">
            Active Campaigns
          </CardTitle>
          <Button size="sm" variant="ghost" data-testid="add-campaign">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No active campaigns</p>
            <Button size="sm" data-testid="create-first-campaign">
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeCampaigns.map((campaign) => {
              const stats = campaignStats?.[campaign.id] || { sent: 0, opened: 0, clicked: 0 };
              const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
              const clickRate = stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0;
              const nextScheduled = getNextScheduled(campaign);

              return (
                <div 
                  key={campaign.id} 
                  className="p-4 rounded-lg bg-muted/50 border border-border"
                  data-testid={`campaign-${campaign.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        {campaign.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {nextScheduled ? `Next: ${nextScheduled}` : 
                         campaign.sentAt ? `Sent: ${new Date(campaign.sentAt).toLocaleDateString()}` :
                         `Type: ${campaign.type}`}
                      </p>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {stats.sent?.toLocaleString() || "0"}
                      </p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-accent">
                        {campaign.status === "sent" ? `${openRate}%` : "--"}
                      </p>
                      <p className="text-xs text-muted-foreground">Opened</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-chart-4">
                        {campaign.status === "sent" ? `${clickRate}%` : "--"}
                      </p>
                      <p className="text-xs text-muted-foreground">Clicked</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
