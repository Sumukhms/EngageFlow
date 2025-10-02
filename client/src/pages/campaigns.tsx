import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Send, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { EmailCampaign } from "@shared/schema";

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/send`);
      return response.json();
    },
    onSuccess: (data, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign sent",
        description: `Successfully sent to ${data.sent} recipients`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    },
  });

  const filteredCampaigns = campaigns?.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "sent": return "bg-chart-4 text-white";
      case "scheduled": return "bg-secondary text-secondary-foreground";
      case "sending": return "bg-accent text-accent-foreground";
      case "draft": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder": return "⏰";
      case "welcome": return "👋";
      case "follow-up": return "💌";
      case "content-preview": return "📄";
      case "thank-you": return "💝";
      default: return "📧";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-10" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="w-64 h-10" />
          <Skeleton className="w-32 h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Email Campaigns</h1>
          <p className="text-muted-foreground">
            {campaigns?.length || 0} total campaigns
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2" data-testid="create-campaign-button">
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm 
              onSuccess={() => {
                setIsCreateOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-campaigns"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Mail className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || statusFilter !== "all" ? "No campaigns found" : "No campaigns yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filters"
              : "Get started by creating your first email campaign"
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button onClick={() => setIsCreateOpen(true)} data-testid="create-first-campaign">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover-lift cursor-pointer" data-testid={`campaign-card-${campaign.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(campaign.type)}</span>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {campaign.subject}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="capitalize">{campaign.type.replace('-', ' ')}</span>
                  </div>
                  
                  {campaign.scheduledAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span>{new Date(campaign.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {campaign.sentAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sent:</span>
                      <span>{new Date(campaign.sentAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(campaign.createdAt!).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    {campaign.status === "draft" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sendCampaignMutation.mutate(campaign.id)}
                        disabled={sendCampaignMutation.isPending}
                        data-testid={`send-campaign-${campaign.id}`}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Send Now
                      </Button>
                    )}
                    
                    {campaign.status === "scheduled" && (
                      <Button size="sm" variant="outline" disabled>
                        <Calendar className="w-3 h-3 mr-1" />
                        Scheduled
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost" data-testid={`edit-campaign-${campaign.id}`}>
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
