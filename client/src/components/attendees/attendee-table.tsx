import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Mail, 
  Edit, 
  Trash, 
  Star,
  Building,
  Calendar,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Attendee } from "@shared/schema";

interface AttendeeTableProps {
  attendees: Attendee[];
}

export function AttendeeTable({ attendees }: AttendeeTableProps) {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const { toast } = useToast();

  const updateAttendeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Attendee> }) => {
      const response = await apiRequest("PUT", `/api/attendees/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendees"] });
      toast({
        title: "Attendee updated",
        description: "The attendee has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendee",
        variant: "destructive",
      });
    },
  });

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { label: "High", color: "bg-chart-4 text-white" };
    if (score >= 50) return { label: "Medium", color: "bg-accent text-accent-foreground" };
    if (score >= 20) return { label: "Low", color: "bg-secondary text-secondary-foreground" };
    return { label: "Inactive", color: "bg-muted text-muted-foreground" };
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSelectAll = () => {
    if (selectedAttendees.length === attendees.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(attendees.map(a => a.id));
    }
  };

  const handleSelectAttendee = (attendeeId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(attendeeId)
        ? prev.filter(id => id !== attendeeId)
        : [...prev, attendeeId]
    );
  };

  const handleSendEmail = (attendee: Attendee) => {
    toast({
      title: "Email feature",
      description: `Email functionality for ${attendee.name} will be implemented`,
    });
  };

  const handleEditAttendee = (attendee: Attendee) => {
    toast({
      title: "Edit feature",
      description: `Edit functionality for ${attendee.name} will be implemented`,
    });
  };

  const handleDeleteAttendee = (attendee: Attendee) => {
    toast({
      title: "Delete feature",
      description: `Delete functionality for ${attendee.name} will be implemented`,
      variant: "destructive",
    });
  };

  if (attendees.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Activity className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No attendees found</h3>
        <p className="text-muted-foreground">No attendees match your current search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Actions Bar */}
      {selectedAttendees.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">
            {selectedAttendees.length} attendee{selectedAttendees.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" data-testid="bulk-email-selected">
              <Mail className="w-3 h-3 mr-1" />
              Send Email
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setSelectedAttendees([])}
              data-testid="clear-selection"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAttendees.length === attendees.length}
                  onCheckedChange={handleSelectAll}
                  data-testid="select-all-attendees"
                />
              </TableHead>
              <TableHead>Attendee</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Interests</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendees.map((attendee) => {
              const engagement = getEngagementLevel(attendee.engagementScore || 0);
              const isSelected = selectedAttendees.includes(attendee.id);

              return (
                <TableRow 
                  key={attendee.id} 
                  className={isSelected ? "bg-muted/50" : ""}
                  data-testid={`attendee-row-${attendee.id}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectAttendee(attendee.id)}
                      data-testid={`select-attendee-${attendee.id}`}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${attendee.name}`} 
                          alt={attendee.name}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(attendee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{attendee.name}</div>
                        <div className="text-sm text-muted-foreground">{attendee.email}</div>
                        {attendee.jobTitle && (
                          <div className="text-xs text-muted-foreground">{attendee.jobTitle}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {attendee.company ? (
                      <div className="flex items-center space-x-2">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{attendee.company}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {attendee.interests && attendee.interests.length > 0 ? (
                        <>
                          {attendee.interests.slice(0, 2).map((interest, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {attendee.interests.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{attendee.interests.length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={engagement.color}>
                        {engagement.label}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-chart-5" />
                        <span className="text-sm font-medium">{attendee.engagementScore || 0}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(attendee.registrationDate!)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Activity className="w-3 h-3" />
                      <span>{formatDate(attendee.lastActivity!)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`attendee-actions-${attendee.id}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSendEmail(attendee)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAttendee(attendee)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAttendee(attendee)}
                          className="text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
