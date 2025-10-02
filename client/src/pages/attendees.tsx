import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AttendeeTable } from "@/components/attendees/attendee-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAttendeeSchema } from "@shared/schema";
import type { Attendee, InsertAttendee } from "@shared/schema";
import { z } from "zod";

const attendeeFormSchema = insertAttendeeSchema.extend({
  interests: z.array(z.string()).optional(),
});

export default function Attendees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  const { data: attendees, isLoading } = useQuery<Attendee[]>({
    queryKey: ["/api/attendees"],
  });

  const createAttendeeMutation = useMutation({
    mutationFn: async (data: InsertAttendee) => {
      const response = await apiRequest("POST", "/api/attendees", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendees"] });
      setIsCreateOpen(false);
      toast({
        title: "Attendee created",
        description: "The attendee has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create attendee",
        variant: "destructive",
      });
    },
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

  const onSubmit = (data: z.infer<typeof attendeeFormSchema>) => {
    createAttendeeMutation.mutate(data);
  };

  const filteredAttendees = attendees?.filter((attendee) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      attendee.name.toLowerCase().includes(searchLower) ||
      attendee.email.toLowerCase().includes(searchLower) ||
      attendee.company?.toLowerCase().includes(searchLower) ||
      attendee.jobTitle?.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-48 h-8" />
          <div className="flex space-x-2">
            <Skeleton className="w-32 h-10" />
            <Skeleton className="w-32 h-10" />
          </div>
        </div>
        <Skeleton className="w-64 h-10" />
        <Skeleton className="w-full h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Attendees</h1>
          <p className="text-muted-foreground">
            {attendees?.length || 0} total attendees
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2" data-testid="export-attendees">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          
          <Button variant="outline" className="flex items-center space-x-2" data-testid="bulk-email">
            <Mail className="w-4 h-4" />
            <span>Bulk Email</span>
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2" data-testid="add-attendee-button">
                <Plus className="w-4 h-4" />
                <span>Add Attendee</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Attendee</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} data-testid="input-name" />
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
                          <Input type="email" placeholder="Enter email address" {...field} data-testid="input-email" />
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
                          <Input placeholder="Enter company name" {...field} data-testid="input-company" />
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
                          <Input placeholder="Enter job title" {...field} data-testid="input-job-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                      data-testid="cancel-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createAttendeeMutation.isPending}
                      data-testid="submit-attendee"
                    >
                      {createAttendeeMutation.isPending ? "Adding..." : "Add Attendee"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-attendees"
          />
        </div>
      </div>

      {/* Attendees Table */}
      <AttendeeTable attendees={filteredAttendees} />
    </div>
  );
}
