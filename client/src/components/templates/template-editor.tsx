import { useMutation } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Eye, 
  Code, 
  Wand2, 
  Plus, 
  X,
  Copy,
  Lightbulb,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmailTemplateSchema } from "@shared/schema";
import type { EmailTemplate, InsertEmailTemplate } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";

const templateFormSchema = insertEmailTemplateSchema.extend({
  variables: z.array(z.string()).optional(),
});

interface TemplateEditorProps {
  template?: EmailTemplate;
  onSuccess: () => void;
}

const commonVariables = [
  "attendeeName",
  "attendeeEmail", 
  "attendeeCompany",
  "eventTitle",
  "eventDescription", 
  "eventDate",
  "eventTime",
  "eventLocation",
  "timeUntil",
  "resourceLinks",
  "feedbackLink"
];

const templateSuggestions = {
  welcome: {
    subject: "Welcome to {{eventTitle}}!",
    content: `Hi {{attendeeName}},

Thank you for registering for {{eventTitle}}! We're excited to have you join us.

Event Details:
📅 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: {{eventLocation}}

What to expect:
{{eventDescription}}

We'll send you reminders as the event approaches. If you have any questions, please don't hesitate to reach out.

Looking forward to seeing you there!

Best regards,
The EventBoost Team`
  },
  reminder: {
    subject: "Reminder: {{eventTitle}} starts in {{timeUntil}}",
    content: `Hi {{attendeeName}},

This is a friendly reminder that {{eventTitle}} is starting in {{timeUntil}}.

Event Details:
📅 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: {{eventLocation}}

Make sure you're ready to join us! We have some exciting content planned.

See you soon!

Best regards,
The EventBoost Team`
  },
  "thank-you": {
    subject: "Thank you for attending {{eventTitle}}",
    content: `Hi {{attendeeName}},

Thank you for attending {{eventTitle}}! We hope you found it valuable and engaging.

As promised, here are the resources from the event:
{{resourceLinks}}

We'd love to hear your feedback! Please take a moment to share your thoughts:
{{feedbackLink}}

Stay tuned for upcoming events and opportunities to connect with our community.

Best regards,
The EventBoost Team`
  },
  "follow-up": {
    subject: "Following up on {{eventTitle}}",
    content: `Hi {{attendeeName}},

We hope you enjoyed {{eventTitle}} and found the content valuable.

Key takeaways from the event:
• [Summary point 1]
• [Summary point 2]
• [Summary point 3]

Next steps:
• [Action item 1]
• [Action item 2]

Resources:
{{resourceLinks}}

If you have any questions or would like to continue the conversation, please don't hesitate to reach out.

Best regards,
The EventBoost Team`
  },
  "content-preview": {
    subject: "Preview: What to expect at {{eventTitle}}",
    content: `Hi {{attendeeName}},

We're getting closer to {{eventTitle}} and wanted to give you a preview of what's in store!

What you'll learn:
• [Key topic 1]
• [Key topic 2]
• [Key topic 3]

Event agenda:
{{eventDescription}}

Don't forget:
📅 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: {{eventLocation}}

We can't wait to see you there!

Best regards,
The EventBoost Team`
  }
};

export function TemplateEditor({ template, onSuccess }: TemplateEditorProps) {
  const [newVariable, setNewVariable] = useState("");
  const [activeTab, setActiveTab] = useState("edit");
  const { toast } = useToast();

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertEmailTemplate) => {
      const response = await apiRequest("POST", "/api/templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template created",
        description: "Your email template has been successfully created.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: Partial<EmailTemplate>) => {
      const response = await apiRequest("PUT", `/api/templates/${template!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "Your email template has been successfully updated.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      type: template?.type || "reminder",
      subject: template?.subject || "",
      content: template?.content || "",
      variables: template?.variables || [],
      isActive: template?.isActive ?? true,
    },
  });

  const onSubmit = (data: z.infer<typeof templateFormSchema>) => {
    if (template) {
      updateTemplateMutation.mutate(data);
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const addVariable = (variable: string) => {
    const currentVariables = form.getValues("variables") || [];
    if (!currentVariables.includes(variable)) {
      form.setValue("variables", [...currentVariables, variable]);
    }
  };

  const addCustomVariable = () => {
    if (newVariable.trim()) {
      addVariable(newVariable.trim());
      setNewVariable("");
    }
  };

  const removeVariable = (variableToRemove: string) => {
    const currentVariables = form.getValues("variables") || [];
    form.setValue("variables", currentVariables.filter(variable => variable !== variableToRemove));
  };

  const applySuggestion = (type: keyof typeof templateSuggestions) => {
    const suggestion = templateSuggestions[type];
    if (suggestion) {
      form.setValue("subject", suggestion.subject);
      form.setValue("content", suggestion.content);
      form.setValue("type", type);
      
      // Extract and add variables from the suggestion
      const content = suggestion.subject + " " + suggestion.content;
      const variableMatches = content.match(/\{\{(\w+)\}\}/g);
      if (variableMatches) {
        const extractedVariables = variableMatches.map(match => match.slice(2, -2));
        const uniqueVariables = [...new Set(extractedVariables)];
        form.setValue("variables", uniqueVariables);
      }
      
      toast({
        title: "Template applied",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} template has been applied.`,
      });
    }
  };

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues("content");
    const newContent = currentContent + `{{${variable}}}`;
    form.setValue("content", newContent);
    addVariable(variable);
  };

  const renderPreview = () => {
    const subject = form.watch("subject");
    const content = form.watch("content");
    
    // Replace variables with sample data for preview
    const sampleData = {
      attendeeName: "John Doe",
      attendeeEmail: "john.doe@example.com",
      attendeeCompany: "Acme Corp",
      eventTitle: "Tech Innovation Summit 2024",
      eventDescription: "Join us for an exciting day of tech talks and networking",
      eventDate: "December 15, 2024",
      eventTime: "2:00 PM EST",
      eventLocation: "Virtual Event",
      timeUntil: "2 hours",
      resourceLinks: "https://example.com/resources",
      feedbackLink: "https://example.com/feedback"
    };

    let previewSubject = subject;
    let previewContent = content;

    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      previewSubject = previewSubject.replace(regex, value);
      previewContent = previewContent.replace(regex, value);
    });

    return { subject: previewSubject, content: previewContent };
  };

  const preview = renderPreview();
  const isLoading = createTemplateMutation.isPending || updateTemplateMutation.isPending;

  return (
    <div className="h-[600px] overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edit" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Edit</span>
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center space-x-2">
            <Code className="w-4 h-4" />
            <span>Variables</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="edit" className="space-y-6 mt-6">
                {/* Template Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wand2 className="w-5 h-5" />
                      <span>Quick Start Templates</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.keys(templateSuggestions).map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestion(type as keyof typeof templateSuggestions)}
                          data-testid={`apply-${type}-template`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter template name" {...field} data-testid="input-template-name" />
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
                        <FormLabel>Template Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template-type">
                              <SelectValue placeholder="Select template type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="welcome">Welcome</SelectItem>
                            <SelectItem value="reminder">Reminder</SelectItem>
                            <SelectItem value="thank-you">Thank You</SelectItem>
                            <SelectItem value="follow-up">Follow-up</SelectItem>
                            <SelectItem value="content-preview">Content Preview</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email subject" {...field} data-testid="input-template-subject" />
                      </FormControl>
                      <FormDescription>
                        Use variables like {`{{attendeeName}}`} or {`{{eventTitle}}`} for personalization
                      </FormDescription>
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
                          placeholder="Enter your email template content..." 
                          className="min-h-[300px] font-mono" 
                          {...field} 
                          data-testid="input-template-content"
                        />
                      </FormControl>
                      <FormDescription>
                        Write your email template using variables for dynamic content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Template</FormLabel>
                        <FormDescription>
                          Make this template available for use in campaigns
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-template-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="variables" className="space-y-6 mt-6">
                {/* Common Variables */}
                <Card>
                  <CardHeader>
                    <CardTitle>Common Variables</CardTitle>
                    <FormDescription>
                      Click to add these commonly used variables to your template
                    </FormDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {commonVariables.map((variable) => (
                        <Button
                          key={variable}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable)}
                          className="justify-start"
                          data-testid={`add-variable-${variable}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {`{{${variable}}}`}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Variables */}
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add custom variable..."
                        value={newVariable}
                        onChange={(e) => setNewVariable(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomVariable())}
                        data-testid="input-custom-variable"
                      />
                      <Button type="button" onClick={addCustomVariable} size="sm" data-testid="add-custom-variable">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel>Active Variables in Template</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {form.watch("variables")?.map((variable, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{`{{${variable}}}`}</span>
                            <button
                              type="button"
                              onClick={() => removeVariable(variable)}
                              className="ml-1 hover:text-destructive"
                              data-testid={`remove-variable-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Email Preview</span>
                    </CardTitle>
                    <FormDescription>
                      This is how your email will look with sample data
                    </FormDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Subject:</div>
                      <div className="font-semibold text-foreground">{preview.subject || "No subject"}</div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">Content:</div>
                      <div className="text-foreground whitespace-pre-wrap text-sm">
                        {preview.content || "No content"}
                      </div>
                    </div>

                    {/* Preview Tips */}
                    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-accent mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-accent mb-1">Preview Tips:</p>
                          <ul className="text-muted-foreground space-y-1">
                            <li>• Variables are replaced with sample data for preview</li>
                            <li>• Actual emails will use real attendee and event data</li>
                            <li>• Test your template before using it in campaigns</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-6 border-t bg-background sticky bottom-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onSuccess}
                  data-testid="cancel-template"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  data-testid="submit-template"
                >
                  {isLoading 
                    ? (template ? "Updating..." : "Creating...") 
                    : (template ? "Update Template" : "Create Template")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Tabs>
    </div>
  );
}
