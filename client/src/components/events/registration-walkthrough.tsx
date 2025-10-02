import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, User, Calendar, CheckCircle, ArrowRight, ArrowLeft, Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendeeSchema } from "@shared/schema";
import type { Event, Attendee, InsertAttendee } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";

interface RegistrationWalkthroughProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const attendeeFormSchema = insertAttendeeSchema.extend({
  interests: z.array(z.string()).optional(),
});

type RegistrationStep = "profile" | "confirm" | "success";

export function RegistrationWalkthrough({ 
  event, 
  open, 
  onOpenChange,
  onSuccess 
}: RegistrationWalkthroughProps) {
  const [step, setStep] = useState<RegistrationStep>("profile");
  const [createdAttendee, setCreatedAttendee] = useState<Attendee | null>(null);
  const [interestInput, setInterestInput] = useState("");
  const { toast } = useToast();

  const { data: existingAttendees, isLoading: isLoadingAttendees } = useQuery<Attendee[]>({
    queryKey: ["/api/attendees"],
  });

  const form = useForm<z.infer<typeof attendeeFormSchema>>({
    resolver: zodResolver(attendeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      jobTitle: "",
      interests: [],
    },
  });

  const createAttendeeMutation = useMutation({
    mutationFn: async (data: InsertAttendee) => {
      const response = await apiRequest("POST", "/api/attendees", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendees"] });
      setCreatedAttendee(data);
      setStep("confirm");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const response = await apiRequest("POST", `/api/events/${event.id}/register`, { 
        attendeeId 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event.id, "registrations"] });
      setStep("success");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    },
  });

  const addInterest = () => {
    if (interestInput.trim() && !form.getValues('interests')?.includes(interestInput.trim())) {
      const currentInterests = form.getValues('interests') || [];
      form.setValue('interests', [...currentInterests, interestInput.trim()]);
      setInterestInput("");
    }
  };

  const removeInterest = (interestToRemove: string) => {
    const currentInterests = form.getValues('interests') || [];
    form.setValue('interests', currentInterests.filter(interest => interest !== interestToRemove));
  };

  const onProfileSubmit = (data: z.infer<typeof attendeeFormSchema>) => {
    const existingAttendee = existingAttendees?.find(a => a.email === data.email);
    
    if (existingAttendee) {
      setCreatedAttendee(existingAttendee);
      setStep("confirm");
      toast({
        title: "Welcome back!",
        description: "We found your existing profile. Let's confirm your registration.",
      });
      return;
    }

    createAttendeeMutation.mutate(data);
  };

  const handleConfirmRegistration = () => {
    if (createdAttendee) {
      registerMutation.mutate(createdAttendee.id);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("profile");
      setCreatedAttendee(null);
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    }, 300);
  };

  const getProgressPercentage = () => {
    switch (step) {
      case "profile": return 33;
      case "confirm": return 66;
      case "success": return 100;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Register for {event.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Step {step === "profile" ? "1" : step === "confirm" ? "2" : "3"} of 3
            </span>
            <span className="font-medium text-primary">
              {step === "profile" ? "Profile" : step === "confirm" ? "Confirm" : "Complete"}
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        <Separator />

        {/* Step 1: Profile Creation */}
        {step === "profile" && (
          <div className="space-y-6">
            <div className="bg-accent/50 rounded-lg p-4 border border-accent">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Welcome! Let's get you registered</h3>
                  <p className="text-sm text-muted-foreground">
                    First, we need to create your attendee profile. This helps us personalize your event experience
                    and send you relevant updates and reminders.
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            {...field} 
                            data-testid="input-attendee-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="john@example.com" 
                            {...field} 
                            data-testid="input-attendee-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Acme Corp" 
                            {...field} 
                            value={field.value ?? ""}
                            data-testid="input-attendee-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Software Engineer" 
                            {...field} 
                            value={field.value ?? ""}
                            data-testid="input-attendee-job-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Interests (Optional)</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Help us tailor content and recommendations to your interests
                  </p>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="e.g., AI, Web Development, Design..."
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                      data-testid="input-interest"
                    />
                    <Button 
                      type="button" 
                      onClick={addInterest} 
                      size="sm" 
                      variant="outline"
                      data-testid="button-add-interest"
                    >
                      Add
                    </Button>
                  </div>
                  
                  {form.watch('interests') && form.watch('interests')!.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.watch('interests')?.map((interest, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="flex items-center space-x-1 cursor-pointer hover:bg-secondary/80"
                          onClick={() => removeInterest(interest)}
                          data-testid={`badge-interest-${index}`}
                        >
                          <span>{interest}</span>
                          <span className="text-xs ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel-profile"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAttendeeMutation.isPending || isLoadingAttendees}
                    data-testid="button-next-to-confirm"
                  >
                    {createAttendeeMutation.isPending || isLoadingAttendees ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isLoadingAttendees ? "Loading..." : "Creating Profile..."}
                      </>
                    ) : (
                      <>
                        Next: Confirm Registration
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === "confirm" && createdAttendee && (
          <div className="space-y-6">
            <div className="bg-accent/50 rounded-lg p-4 border border-accent">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-chart-4 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Profile Created Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Please review your details and confirm your registration for this event.
                  </p>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                Event Details
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium text-sm">{formatDate(event.startDate.toString())}</span>
                </div>
                {event.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{event.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span className="font-medium">{event.timezone}</span>
                </div>
              </div>
            </div>

            {/* Attendee Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center">
                <User className="w-4 h-4 mr-2 text-primary" />
                Your Profile
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{createdAttendee.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{createdAttendee.email}</span>
                </div>
                {createdAttendee.company && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{createdAttendee.company}</span>
                  </div>
                )}
                {createdAttendee.jobTitle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Title:</span>
                    <span className="font-medium">{createdAttendee.jobTitle}</span>
                  </div>
                )}
                {createdAttendee.interests && createdAttendee.interests.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Interests:</span>
                    <div className="flex flex-wrap gap-1 max-w-xs justify-end">
                      {createdAttendee.interests.map((interest, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep("profile")}
                data-testid="button-back-to-profile"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleConfirmRegistration}
                disabled={registerMutation.isPending}
                data-testid="button-confirm-registration"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    Confirm Registration
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-chart-4/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-chart-4" />
              </div>
              
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                  You're All Set!
                </h2>
                <p className="text-muted-foreground">
                  Your registration for <span className="font-semibold text-foreground">{event.title}</span> is confirmed.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-center">What happens next?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Welcome Email</p>
                    <p className="text-sm text-muted-foreground">
                      Check your inbox for a welcome email with event details and important information.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Event Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      We'll send you timely reminders before the event so you don't miss it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Personalized Content</p>
                    <p className="text-sm text-muted-foreground">
                      Based on your interests, we'll share relevant content and session recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleClose}
                size="lg"
                data-testid="button-close-success"
              >
                Great! I'm Ready
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
