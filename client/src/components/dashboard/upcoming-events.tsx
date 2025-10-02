import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Event, EventRegistration } from "@shared/schema";

export function UpcomingEvents() {
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: registrations, isLoading: registrationsLoading } = useQuery<EventRegistration[]>({
    queryKey: ["/api/events", "registrations"],
    queryFn: async () => {
      const response = await fetch("/api/events/all/registrations");
      if (!response.ok) throw new Error("Failed to fetch registrations");
      return response.json();
    },
  });

  const isLoading = eventsLoading || registrationsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-16 h-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 rounded-lg border">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-5" />
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-full h-2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Filter for upcoming events and sort by date
  const upcomingEvents = events?.filter(event => {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    return eventDate > now && (event.status === "published" || event.status === "live");
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3) || [];

  // Get registration count for each event
  const getRegistrationCount = (eventId: string) => {
    return registrations?.filter(reg => reg.eventId === eventId).length || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-accent text-accent-foreground";
      case "published": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card data-testid="upcoming-events">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading font-semibold">
            Upcoming Events
          </CardTitle>
          <Link href="/events" className="text-sm text-primary hover:underline font-medium">
            View all
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => {
              const registrationCount = getRegistrationCount(event.id);
              const maxAttendees = event.maxAttendees || 100;
              const fillPercentage = Math.min((registrationCount / maxAttendees) * 100, 100);
              
              return (
                <div 
                  key={event.id} 
                  className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  data-testid={`upcoming-event-${event.id}`}
                >
                  <img 
                    src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                    alt={`${event.title} event`}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground line-clamp-1">
                        {event.title}
                      </h4>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status === "live" ? "Live" : "Upcoming"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1.5" />
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1.5" />
                        {registrationCount} registered
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${fillPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(fillPercentage)}%
                      </span>
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
