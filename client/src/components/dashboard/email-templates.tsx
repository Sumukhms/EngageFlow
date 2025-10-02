import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Clock, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { EmailTemplate } from "@shared/schema";

export function EmailTemplates() {
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/templates"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-64 h-4" />
            </div>
            <Skeleton className="w-32 h-10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <Skeleton className="w-full h-32" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-16 h-5" />
                  </div>
                  <Skeleton className="w-full h-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-20 h-3" />
                    <Skeleton className="w-8 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "welcome": return "bg-chart-4 text-white";
      case "reminder": return "bg-primary text-primary-foreground";
      case "thank-you": return "bg-secondary text-secondary-foreground";
      case "follow-up": return "bg-accent text-accent-foreground";
      case "content-preview": return "bg-chart-5 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "welcome": return "👋";
      case "reminder": return "⏰";
      case "thank-you": return "💝";
      case "follow-up": return "💌";
      case "content-preview": return "📄";
      default: return "📧";
    }
  };

  const activeTemplates = templates?.slice(0, 5) || [];

  return (
    <Card data-testid="email-templates">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-heading font-semibold">
              Email Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your automated messaging templates
            </p>
          </div>
          <Link href="/templates">
            <Button className="flex items-center space-x-2" data-testid="new-template-button">
              <Plus className="w-4 h-4" />
              <span>New Template</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No templates yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first email template to get started
            </p>
            <Link href="/templates">
              <Button data-testid="create-first-template">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTemplates.map((template) => (
              <div 
                key={template.id} 
                className="border border-border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                data-testid={`template-${template.id}`}
              >
                <div className="bg-muted p-4 h-32 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 gradient-primary opacity-5"></div>
                  <span className="text-4xl opacity-30 group-hover:opacity-50 transition-opacity">
                    {getTypeIcon(template.type)}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground text-sm line-clamp-1">
                      {template.name}
                    </h4>
                    <Badge className={getTypeColor(template.type)}>
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.type === "reminder" ? "Sent 24h before event start" :
                     template.type === "welcome" ? "Sent on registration" :
                     template.type === "thank-you" ? "Sent after event completion" :
                     template.type === "follow-up" ? "Sent 24h after event" :
                     "Custom template"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Updated: {new Date(template.updatedAt!).toLocaleDateString()}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-primary hover:underline p-0 h-auto"
                      data-testid={`edit-template-${template.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Create new template card */}
            <Link href="/templates">
              <div className="border-2 border-dashed border-border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group">
                <div className="bg-muted/30 p-4 h-32 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Create Template</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Add a new email template for your campaigns
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
