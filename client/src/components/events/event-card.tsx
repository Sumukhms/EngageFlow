import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Users, Edit, Trash, Eye, UserPlus } from "lucide-react";
import { EventForm } from "./event-form";
import { RegistrationWalkthrough } from "./registration-walkthrough";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { Event, EventRegistration } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EventCardProps {
  event: Event;
  onDelete: () => void;
  isDeleting: boolean;
}

export function EventCard({ event, onDelete, isDeleting }: EventCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const { data: registrations } = useQuery<EventRegistration[]>({
    queryKey: ["/api/events", event.id, "registrations"],
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/registrations`);
      if (!response.ok) throw new Error("Failed to fetch registrations");
      return response.json();
    },
  });

  const registrationCount = registrations?.length || 0;
  const maxAttendees = event.maxAttendees || 100;
  const fillPercentage = Math.min((registrationCount / maxAttendees) * 100, 100);
  const isFull = event.maxAttendees ? registrationCount >= event.maxAttendees : false;
  const canRegister = event.status === "published" || event.status === "live";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-accent text-accent-foreground";
      case "published": return "bg-chart-4 text-white";
      case "completed": return "bg-secondary text-secondary-foreground";
      case "cancelled": return "bg-destructive text-destructive-foreground";
      case "draft": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDate(event.startDate);

  return (
    <>
      <Card className="hover-lift cursor-pointer overflow-hidden" data-testid={`event-card-${event.id}`}>
        <div className="relative">
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"} 
            alt={`${event.title} event`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Badge className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
          </div>
        </div>
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-heading font-semibold text-foreground line-clamp-2">
              {event.title}
            </h3>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Event Details */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{date}</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span>{time} {event.timezone}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              <span>{registrationCount} registered</span>
              {event.maxAttendees && <span> / {event.maxAttendees} max</span>}
            </div>
          </div>

          {/* Registration Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Registration</span>
              <span className="font-medium">{Math.round(fillPercentage)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{event.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t gap-2">
            {canRegister && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsRegisterOpen(true)}
                disabled={isFull}
                className="flex-1"
                data-testid={`register-event-${event.id}`}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                {isFull ? "Event Full" : "Register"}
              </Button>
            )}
            
            <div className="flex items-center space-x-1">
              <Button 
                variant="outline" 
                size="sm"
                data-testid={`view-event-${event.id}`}
              >
                <Eye className="w-3 h-3" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditOpen(true)}
                data-testid={`edit-event-${event.id}`}
              >
                <Edit className="w-3 h-3" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isDeleting}
                    data-testid={`delete-event-${event.id}`}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{event.title}"? This action cannot be undone.
                      All registrations and associated data will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Event"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm 
            event={event}
            onSuccess={() => {
              setIsEditOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/events"] });
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Registration Walkthrough */}
      <RegistrationWalkthrough 
        event={event}
        open={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/events", event.id, "registrations"] });
        }}
      />
    </>
  );
}
