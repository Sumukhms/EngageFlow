import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { emailService } from "./services/emailService";
import { aiPersonalizationService } from "./services/aiPersonalization";
import { schedulerService } from "./services/schedulerService";
import { 
  insertEventSchema,
  insertAttendeeSchema, 
  insertEventRegistrationSchema,
  insertEmailCampaignSchema,
  insertEmailTemplateSchema,
  insertContentPreviewSchema,
  insertAnalyticsEventSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Events routes
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const updatedEvent = await storage.updateEvent(req.params.id, req.body);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Attendees routes
  app.get("/api/attendees", async (_req, res) => {
    try {
      const attendees = await storage.getAttendees();
      res.json(attendees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendees" });
    }
  });

  app.get("/api/attendees/:id", async (req, res) => {
    try {
      const attendee = await storage.getAttendee(req.params.id);
      if (!attendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      res.json(attendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendee" });
    }
  });

  app.post("/api/attendees", async (req, res) => {
    try {
      const validatedData = insertAttendeeSchema.parse(req.body);
      
      // Check if attendee already exists
      const existing = await storage.getAttendeeByEmail(validatedData.email);
      if (existing) {
        return res.status(409).json({ message: "Attendee with this email already exists" });
      }
      
      const attendee = await storage.createAttendee(validatedData);
      res.status(201).json(attendee);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendee data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/attendees/:id", async (req, res) => {
    try {
      const updatedAttendee = await storage.updateAttendee(req.params.id, req.body);
      if (!updatedAttendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      res.json(updatedAttendee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendee" });
    }
  });

  // Event registrations routes
  app.get("/api/events/:eventId/registrations", async (req, res) => {
    try {
      const registrations = await storage.getEventRegistrations(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.post("/api/events/:eventId/register", async (req, res) => {
    try {
      const { attendeeId } = req.body;
      
      if (!attendeeId) {
        return res.status(400).json({ message: "Attendee ID is required" });
      }

      // Check if already registered
      const existingRegistrations = await storage.getEventRegistrations(req.params.eventId);
      const alreadyRegistered = existingRegistrations.some(r => r.attendeeId === attendeeId);
      
      if (alreadyRegistered) {
        return res.status(409).json({ message: "Already registered for this event" });
      }

      const registration = await storage.createEventRegistration({
        eventId: req.params.eventId,
        attendeeId,
      });

      // Send welcome email
      const attendee = await storage.getAttendee(attendeeId);
      const event = await storage.getEvent(req.params.eventId);
      const templates = await storage.getEmailTemplates();
      const welcomeTemplate = templates.find(t => t.type === "welcome");

      if (attendee && event && welcomeTemplate) {
        const campaign = await storage.createEmailCampaign({
          name: `Welcome - ${event.title}`,
          type: "welcome",
          eventId: req.params.eventId,
          templateId: welcomeTemplate.id,
          subject: welcomeTemplate.subject,
          content: welcomeTemplate.content,
          status: "scheduled",
          scheduledAt: new Date(),
        });

        // Send welcome email immediately
        await emailService.sendCampaignEmail(campaign, attendee);
      }

      res.status(201).json(registration);
    } catch (error) {
      res.status(400).json({ message: "Failed to register for event", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/registrations/:id", async (req, res) => {
    try {
      const updatedRegistration = await storage.updateEventRegistration(req.params.id, req.body);
      if (!updatedRegistration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.json(updatedRegistration);
    } catch (error) {
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  // Email campaigns routes
  app.get("/api/campaigns", async (_req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertEmailCampaignSchema.parse(req.body);
      const campaign = await storage.createEmailCampaign(validatedData);
      
      // Schedule the campaign if scheduledAt is provided
      if (campaign.scheduledAt && campaign.status === "scheduled") {
        await schedulerService.scheduleCustomCampaign(campaign.id, new Date(campaign.scheduledAt));
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ message: "Invalid campaign data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const updatedCampaign = await storage.updateEmailCampaign(req.params.id, req.body);
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(updatedCampaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.post("/api/campaigns/:id/send", async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const result = await emailService.sendBulkCampaign(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.get("/api/campaigns/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getEmailSendStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign stats" });
    }
  });

  // Email templates routes
  app.get("/api/templates", async (_req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const updatedTemplate = await storage.updateEmailTemplate(req.params.id, req.body);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Content previews routes
  app.get("/api/events/:eventId/content-previews", async (req, res) => {
    try {
      const previews = await storage.getContentPreviews(req.params.eventId);
      res.json(previews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content previews" });
    }
  });

  app.post("/api/events/:eventId/content-previews", async (req, res) => {
    try {
      const validatedData = insertContentPreviewSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
      });
      const preview = await storage.createContentPreview(validatedData);
      res.status(201).json(preview);
    } catch (error) {
      res.status(400).json({ message: "Invalid content preview data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Analytics routes
  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const metrics = await storage.getEngagementMetrics(days);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics metrics" });
    }
  });

  app.get("/api/analytics/events", async (req, res) => {
    try {
      const filters = {
        eventType: req.query.eventType as string,
        eventId: req.query.eventId as string,
        attendeeId: req.query.attendeeId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      
      const events = await storage.getAnalyticsEvents(filters);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics events" });
    }
  });

  app.post("/api/analytics/events", async (req, res) => {
    try {
      const validatedData = insertAnalyticsEventSchema.parse(req.body);
      const analyticsEvent = await storage.createAnalyticsEvent(validatedData);
      res.status(201).json(analyticsEvent);
    } catch (error) {
      res.status(400).json({ message: "Invalid analytics event data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      const attendees = await storage.getAttendees();
      const campaigns = await storage.getEmailCampaigns();
      const registrations = await storage.getEventRegistrations();

      // Calculate active events (published or live)
      const activeEvents = events.filter(e => e.status === "published" || e.status === "live");
      
      // Calculate total registrations
      const totalRegistrations = registrations.length;
      
      // Calculate average attendance rate
      const attendedRegistrations = registrations.filter(r => r.attended);
      const attendanceRate = totalRegistrations > 0 
        ? Math.round((attendedRegistrations.length / totalRegistrations) * 100)
        : 0;

      // Calculate average email open rate from recent campaigns
      const recentCampaigns = campaigns.slice(0, 10); // Last 10 campaigns
      let totalSent = 0;
      let totalOpened = 0;
      
      for (const campaign of recentCampaigns) {
        const stats = await storage.getEmailSendStats(campaign.id);
        totalSent += stats.sent;
        totalOpened += stats.opened;
      }
      
      const emailOpenRate = totalSent > 0 
        ? Math.round((totalOpened / totalSent) * 100)
        : 0;

      const stats = {
        activeEvents: activeEvents.length,
        totalRegistrations,
        attendanceRate,
        emailOpenRate,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // AI personalization routes
  app.post("/api/ai/personalize-content", async (req, res) => {
    try {
      const { attendeeId, eventId, templateId } = req.body;
      
      const attendee = await storage.getAttendee(attendeeId);
      const event = eventId ? await storage.getEvent(eventId) : undefined;
      const template = await storage.getEmailTemplate(templateId);
      
      if (!attendee || !template) {
        return res.status(404).json({ message: "Attendee or template not found" });
      }

      const personalized = await aiPersonalizationService.personalizeEmailContent({
        attendee,
        event,
        template,
      });

      res.json(personalized);
    } catch (error) {
      res.status(500).json({ message: "Failed to personalize content", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/ai/content-suggestions", async (req, res) => {
    try {
      const { eventId, attendeeInterests } = req.body;
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const suggestions = await aiPersonalizationService.generateEventContentSuggestions(
        event,
        attendeeInterests || []
      );

      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate content suggestions", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Email tracking routes
  app.get("/api/track/open/:emailSendId", async (req, res) => {
    try {
      await emailService.trackEmailOpen(req.params.emailSendId);
      
      // Return a 1x1 transparent pixel
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(pixel);
    } catch (error) {
      res.status(500).json({ message: "Failed to track email open" });
    }
  });

  app.get("/api/track/click/:emailSendId", async (req, res) => {
    try {
      await emailService.trackEmailClick(req.params.emailSendId);
      
      // Redirect to the intended URL (could be passed as query param)
      const redirectUrl = req.query.url as string || '/';
      res.redirect(redirectUrl);
    } catch (error) {
      res.status(500).json({ message: "Failed to track email click" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
