import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Mail, Users, Brain, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmailCampaignSchema } from "@shared/schema";
import type { EmailCampaign, InsertEmailCampaign, Event, EmailTemplate } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const campaignFormSchema = insertEmailCampaignSchema.extend({
  targetAudience: z.object({
    interests: z.array(z.string()).optional(),
    engagementScore: z.object({
      min: z.number().min(0).max(100),
      max: z.number().min(0).max(100),
    }).optional(),
    attendanceHistory: z.enum(["all", "attended", "not-attended"]).optional(),
  }).optional(),
});

interface CampaignFormProps {
  campaign?: EmailCampaign;
  onSuccess: () => void;
}

export function CampaignForm({ campaign, onSuccess }: CampaignFormProps) {
  const [newInterest, setNewInterest] = useState("");
  const [useAiPersonalization, setUseAiPersonalization] = useState(false);
  const { toast } = useToast();

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: InsertEmailCampaign) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign created",
        description: "Your email campaign has been successfully created.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: Partial<EmailCampaign>) => {
      const response = await apiRequest("PUT", `/api/campaigns/${campaign!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign updated",
        description: "Your email campaign has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const aiPersonalizationMutation = useMutation({
    mutationFn: async ({ templateId, eventId }: { templateId: string; eventId?: string }) => {
      const response = await apiRequest("POST", "/api/ai/content-suggestions", {
        eventId,
        attendeeInterests: form.getValues("targetAudience.interests") || [],
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI suggestions generated",
        description: "Content has been enhanced with AI recommendations.",
      });
      // Apply AI suggestions to the form
      const currentContent = form.getValues("content");
      const enhancedContent = `${currentContent}\n\n--- AI Suggestions ---\nContent Topics: ${data.contentTopics?.join(", ")}\nAgenda Ideas: ${data.agenda?.join(", ")}`;
      form.setValue("content", enhancedContent);
    },
    onError: (error: Error) => {
      toast({
        title: "AI Enhancement Failed",
        description: error.message || "Could not generate AI suggestions",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: campaign?.name || "",
      type: campaign?.type || "reminder",
      eventId: campaign?.eventId || "",
      templateId: campaign?.templateId || "",
      subject: campaign?.subject || "",
      content: campaign?.content || "",
      scheduledAt: campaign?.scheduledAt ? new Date(campaign.scheduledAt) : undefined,
      status: campaign?.status || "draft",
      targetAudience: {
        interests: campaign?.targetAudience?.interests || [],
        engagementScore: campaign?.targetAudience?.engagementScore || { min: 0, max: 100 },
        attendanceHistory: campaign?.targetAudience?.attendanceHistory || "all",
      },
    },
  });

  const onSubmit = (data: z.infer<typeof campaignFormSchema>) => {
    if (campaign) {
      updateCampaignMutation.mutate(data);
    } else {
      createCampaignMutation.mutate(data);
    }
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      const currentInterests = form.getValues("targetAudience.interests") || [];
      if (!currentInterests.includes(newInterest.trim())) {
        form.setValue("targetAudience.interests", [...currentInterests, newInterest.trim()]);
        setNewInterest("");
      }
    }
  };

  const removeInterest = (interestToRemove: string) => {
    const currentInterests = form.getValues("targetAudience.interests") || [];
    form.setValue("targetAudience.interests", currentInterests.filter(interest => interest !== interestToRemove));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      form.setValue("subject", template.subject);
      form.setValue("content", template.content);
      form.setValue("type", template.type);
    }
  };

  const handleAiEnhancement = () => {
    const templateId = form.getValues("templateId");
    const eventId = form.getValues("eventId");
    
    if (templateId) {
      aiPersonalizationMutation.mutate({ templateId, eventId });
    } else {
      toast({
        title: "Template required",
        description: "Please select a template before using AI enhancement.",
        variant: "destructive",
      });
    }
  };

  const isLoading = createCampaignMutation.isPending || updateCampaignMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Campaign Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter campaign name" {...field} data-testid="input-campaign-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign-type">
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="follow-up">Follow-up</SelectItem>
                          <SelectItem value="content-preview">Content Preview</SelectItem>
                          <SelectItem value="thank-you">Thank You</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Event</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-event">
                            <SelectValue placeholder="Select an event (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No specific event</SelectItem>
                          {events?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this campaign to a specific event
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Template</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value) applyTemplate(value);
                        }} 
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-template">
                            <SelectValue placeholder="Select a template (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No template</SelectItem>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} ({template.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Send Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="datetime-local"
                            {...field}
                            value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                            data-testid="input-scheduled-at"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Leave empty to send immediately
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* AI Enhancement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI Enhancement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Use AI Personalization</FormLabel>
                    <FormDescription>
                      Enhance your campaign with AI-generated content suggestions
                    </FormDescription>
                  </div>
                  <Switch
                    checked={useAiPersonalization}
                    onCheckedChange={setUseAiPersonalization}
                    data-testid="switch-ai-personalization"
                  />
                </div>

                {useAiPersonalization && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAiEnhancement}
                    disabled={aiPersonalizationMutation.isPending}
                    data-testid="enhance-with-ai"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {aiPersonalizationMutation.isPending ? "Enhancing..." : "Enhance with AI"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content & Targeting */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email subject" {...field} data-testid="input-subject" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Content *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your email content..." 
                          className="min-h-[200px]" 
                          {...field} 
                          data-testid="input-content"
                        />
                      </FormControl>
                      <FormDescription>
                        You can use variables like {`{{attendeeName}}`}, {`{{eventTitle}}`}, {`{{eventDate}}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Target Audience</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="targetAudience.attendanceHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance History</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-attendance-history">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Attendees</SelectItem>
                          <SelectItem value="attended">Previously Attended</SelectItem>
                          <SelectItem value="not-attended">Never Attended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Interest Targeting</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add interest..."
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      data-testid="input-new-interest"
                    />
                    <Button type="button" onClick={addInterest} size="sm" data-testid="add-interest-button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {form.watch("targetAudience.interests")?.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{interest}</span>
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`remove-interest-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetAudience.engagementScore.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Engagement Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min={0}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-min-engagement"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience.engagementScore.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Engagement Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min={0}
                            max={100}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                            data-testid="input-max-engagement"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormLabel>Status:</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-32" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSuccess}
              data-testid="cancel-campaign"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="submit-campaign"
            >
              {isLoading 
                ? (campaign ? "Updating..." : "Creating...") 
                : (campaign ? "Update Campaign" : "Create Campaign")
              }
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
