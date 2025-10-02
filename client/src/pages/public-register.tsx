import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Event, InsertAttendee } from "@shared/schema";
import { insertAttendeeSchema } from "@shared/schema";

export default function PublicRegister() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const publishedEvents = events.filter(e => e.status === "published" || e.status === "live");

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-green-500 dark:bg-green-600";
      case "published": return "bg-blue-500 dark:bg-blue-600";
      default: return "bg-gray-500 dark:bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-card">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gradient">
            Discover Amazing Events
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Register for webinars and events that match your interests. Get personalized content and reminders.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="skeleton h-64" />
            ))}
          </div>
        ) : publishedEvents.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Events Available</h3>
            <p className="text-muted-foreground">Check back soon for upcoming events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedEvents.map((event) => (
              <Card 
                key={event.id} 
                className="hover-lift overflow-hidden border-2 transition-colors hover:border-primary/50" 
                data-testid={`card-event-${event.id}`}
              >
                {event.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getStatusColor(event.status || "draft")}>
                      {event.status || "draft"}
                    </Badge>
                    {event.tags && event.tags.length > 0 && (
                      <Badge variant="outline">{event.tags[0]}</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description || "No description available"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {event.startDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(event.startDate), "MMM dd, yyyy")}
                      </div>
                    )}
                    {event.startDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        {format(new Date(event.startDate), "h:mm a")}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    )}
                    {event.maxAttendees && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        Capacity: {event.maxAttendees}
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full gradient-primary" 
                    onClick={() => handleRegister(event)}
                    data-testid={`button-register-${event.id}`}
                  >
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <RegistrationDialog 
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onSuccess={() => {
          setSelectedEvent(null);
          setRegistrationComplete(true);
        }}
      />

      <Dialog open={registrationComplete} onOpenChange={setRegistrationComplete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center">Registration Successful!</DialogTitle>
            <DialogDescription className="text-center">
              You've been registered for the event. Check your email for confirmation and event details.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setRegistrationComplete(false)} className="w-full">
            Browse More Events
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegistrationDialog({ 
  event, 
  open, 
  onClose,
  onSuccess 
}: { 
  event: Event | null; 
  open: boolean; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  
  const form = useForm<InsertAttendee>({
    resolver: zodResolver(insertAttendeeSchema),
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
      const res = await apiRequest("POST", "/api/attendees", data);
      return await res.json();
    },
    onSuccess: async (attendee) => {
      if (event) {
        await registerForEventMutation.mutateAsync({
          eventId: event.id,
          attendeeId: attendee.id,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create attendee profile",
        variant: "destructive",
      });
    },
  });

  const registerForEventMutation = useMutation({
    mutationFn: async ({ eventId, attendeeId }: { eventId: string; attendeeId: string }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/register`, { attendeeId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success!",
        description: "You've been registered for the event",
      });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertAttendee) => {
    createAttendeeMutation.mutate(data);
  };

  const isPending = createAttendeeMutation.isPending || registerForEventMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register for {event?.title}</DialogTitle>
          <DialogDescription>
            Fill in your details to complete registration. We'll send you personalized event updates and reminders.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" data-testid="input-name" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" data-testid="input-email" {...field} />
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
                    <Input placeholder="Acme Inc" data-testid="input-company" {...field} value={field.value || ""} />
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
                    <Input placeholder="Product Manager" data-testid="input-jobtitle" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interests (comma-separated)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Technology, Marketing, AI"
                      data-testid="input-interests"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const interests = e.target.value.split(",").map(i => i.trim()).filter(Boolean);
                        field.onChange(interests);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 gradient-primary" 
                disabled={isPending}
                data-testid="button-submit-registration"
              >
                {isPending ? "Registering..." : "Complete Registration"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
