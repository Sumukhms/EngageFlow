import { 
  type Event, type InsertEvent,
  type Attendee, type InsertAttendee,
  type EventRegistration, type InsertEventRegistration,
  type EmailCampaign, type InsertEmailCampaign,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailSend,
  type ContentPreview, type InsertContentPreview,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type User, type InsertUser 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Attendee methods
  getAttendees(): Promise<Attendee[]>;
  getAttendee(id: string): Promise<Attendee | undefined>;
  getAttendeeByEmail(email: string): Promise<Attendee | undefined>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(id: string, attendee: Partial<Attendee>): Promise<Attendee | undefined>;
  updateAttendeeEngagement(id: string, score: number): Promise<void>;

  // Event Registration methods
  getEventRegistrations(eventId?: string): Promise<EventRegistration[]>;
  getAttendeeRegistrations(attendeeId: string): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistration(id: string, registration: Partial<EventRegistration>): Promise<EventRegistration | undefined>;

  // Email Campaign methods
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, campaign: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  getScheduledCampaigns(): Promise<EmailCampaign[]>;

  // Email Template methods
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;

  // Email Send tracking methods
  createEmailSend(send: Omit<EmailSend, 'id'>): Promise<EmailSend>;
  updateEmailSend(id: string, send: Partial<EmailSend>): Promise<void>;
  getEmailSendStats(campaignId: string): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  }>;

  // Content Preview methods
  getContentPreviews(eventId: string): Promise<ContentPreview[]>;
  createContentPreview(preview: InsertContentPreview): Promise<ContentPreview>;

  // Analytics methods
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(filters?: {
    eventType?: string;
    eventId?: string;
    attendeeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AnalyticsEvent[]>;
  getEngagementMetrics(days: number): Promise<{
    registrations: { date: string; count: number }[];
    attendance: { date: string; count: number }[];
    engagement: { date: string; score: number }[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private events: Map<string, Event> = new Map();
  private attendees: Map<string, Attendee> = new Map();
  private eventRegistrations: Map<string, EventRegistration> = new Map();
  private emailCampaigns: Map<string, EmailCampaign> = new Map();
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private emailSends: Map<string, EmailSend> = new Map();
  private contentPreviews: Map<string, ContentPreview> = new Map();
  private analyticsEvents: Map<string, AnalyticsEvent> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed some initial email templates
    const templates: EmailTemplate[] = [
      {
        id: randomUUID(),
        name: "Event Reminder",
        type: "reminder",
        subject: "Don't forget: {{eventTitle}} starts in {{timeUntil}}",
        content: `Hi {{attendeeName}},

This is a friendly reminder that {{eventTitle}} is starting in {{timeUntil}}.

Event Details:
- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{eventLocation}}

We're looking forward to seeing you there!

Best regards,
The EventBoost Team`,
        variables: ["attendeeName", "eventTitle", "timeUntil", "eventDate", "eventTime", "eventLocation"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Welcome Email",
        type: "welcome",
        subject: "Welcome to {{eventTitle}}!",
        content: `Hi {{attendeeName}},

Thank you for registering for {{eventTitle}}! We're excited to have you join us.

Here's what you can expect:
{{eventDescription}}

Mark your calendar:
- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{eventLocation}}

We'll send you reminders as the event approaches.

Best regards,
The EventBoost Team`,
        variables: ["attendeeName", "eventTitle", "eventDescription", "eventDate", "eventTime", "eventLocation"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Thank You Note",
        type: "thank-you",
        subject: "Thank you for attending {{eventTitle}}",
        content: `Hi {{attendeeName}},

Thank you for attending {{eventTitle}}! We hope you found it valuable.

As promised, here are the resources from the event:
{{resourceLinks}}

We'd love to hear your feedback. Please take a moment to rate your experience: {{feedbackLink}}

Stay tuned for upcoming events!

Best regards,
The EventBoost Team`,
        variables: ["attendeeName", "eventTitle", "resourceLinks", "feedbackLink"],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    templates.forEach(template => {
      this.emailTemplates.set(template.id, template);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const now = new Date();
    const event: Event = {
      ...insertEvent,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, updateData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...updateData, updatedAt: new Date() };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Attendee methods
  async getAttendees(): Promise<Attendee[]> {
    return Array.from(this.attendees.values()).sort((a, b) => new Date(b.registrationDate!).getTime() - new Date(a.registrationDate!).getTime());
  }

  async getAttendee(id: string): Promise<Attendee | undefined> {
    return this.attendees.get(id);
  }

  async getAttendeeByEmail(email: string): Promise<Attendee | undefined> {
    return Array.from(this.attendees.values()).find(attendee => attendee.email === email);
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const id = randomUUID();
    const now = new Date();
    const attendee: Attendee = {
      ...insertAttendee,
      id,
      engagementScore: 0,
      registrationDate: now,
      lastActivity: now,
    };
    this.attendees.set(id, attendee);
    return attendee;
  }

  async updateAttendee(id: string, updateData: Partial<Attendee>): Promise<Attendee | undefined> {
    const attendee = this.attendees.get(id);
    if (!attendee) return undefined;

    const updatedAttendee = { ...attendee, ...updateData, lastActivity: new Date() };
    this.attendees.set(id, updatedAttendee);
    return updatedAttendee;
  }

  async updateAttendeeEngagement(id: string, score: number): Promise<void> {
    const attendee = this.attendees.get(id);
    if (attendee) {
      attendee.engagementScore = score;
      attendee.lastActivity = new Date();
      this.attendees.set(id, attendee);
    }
  }

  // Event Registration methods
  async getEventRegistrations(eventId?: string): Promise<EventRegistration[]> {
    let registrations = Array.from(this.eventRegistrations.values());
    if (eventId) {
      registrations = registrations.filter(reg => reg.eventId === eventId);
    }
    return registrations.sort((a, b) => new Date(b.registrationDate!).getTime() - new Date(a.registrationDate!).getTime());
  }

  async getAttendeeRegistrations(attendeeId: string): Promise<EventRegistration[]> {
    return Array.from(this.eventRegistrations.values())
      .filter(reg => reg.attendeeId === attendeeId)
      .sort((a, b) => new Date(b.registrationDate!).getTime() - new Date(a.registrationDate!).getTime());
  }

  async createEventRegistration(insertRegistration: InsertEventRegistration): Promise<EventRegistration> {
    const id = randomUUID();
    const registration: EventRegistration = {
      ...insertRegistration,
      id,
      registrationDate: new Date(),
    };
    this.eventRegistrations.set(id, registration);

    // Track analytics
    await this.createAnalyticsEvent({
      eventType: "registration",
      attendeeId: registration.attendeeId,
      eventId: registration.eventId,
      metadata: { registrationId: id },
    });

    return registration;
  }

  async updateEventRegistration(id: string, updateData: Partial<EventRegistration>): Promise<EventRegistration | undefined> {
    const registration = this.eventRegistrations.get(id);
    if (!registration) return undefined;

    const updatedRegistration = { ...registration, ...updateData };
    this.eventRegistrations.set(id, updatedRegistration);

    // Track attendance analytics if attended status changed
    if (updateData.attended === true) {
      await this.createAnalyticsEvent({
        eventType: "attendance",
        attendeeId: registration.attendeeId,
        eventId: registration.eventId,
        metadata: { registrationId: id, attendanceTime: updateData.attendanceTime },
      });
    }

    return updatedRegistration;
  }

  // Email Campaign methods
  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return Array.from(this.emailCampaigns.values()).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    return this.emailCampaigns.get(id);
  }

  async createEmailCampaign(insertCampaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const id = randomUUID();
    const campaign: EmailCampaign = {
      ...insertCampaign,
      id,
      createdAt: new Date(),
    };
    this.emailCampaigns.set(id, campaign);
    return campaign;
  }

  async updateEmailCampaign(id: string, updateData: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const campaign = this.emailCampaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign = { ...campaign, ...updateData };
    this.emailCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async getScheduledCampaigns(): Promise<EmailCampaign[]> {
    const now = new Date();
    return Array.from(this.emailCampaigns.values())
      .filter(campaign => 
        campaign.status === "scheduled" && 
        campaign.scheduledAt && 
        new Date(campaign.scheduledAt) <= now
      );
  }

  // Email Template methods
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values())
      .filter(template => template.isActive)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = randomUUID();
    const now = new Date();
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: string, updateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...updateData, updatedAt: new Date() };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  // Email Send tracking methods
  async createEmailSend(insertSend: Omit<EmailSend, 'id'>): Promise<EmailSend> {
    const id = randomUUID();
    const send: EmailSend = { ...insertSend, id };
    this.emailSends.set(id, send);
    return send;
  }

  async updateEmailSend(id: string, updateData: Partial<EmailSend>): Promise<void> {
    const send = this.emailSends.get(id);
    if (send) {
      const updatedSend = { ...send, ...updateData };
      this.emailSends.set(id, updatedSend);

      // Track analytics for email interactions
      if (updateData.openedAt) {
        await this.createAnalyticsEvent({
          eventType: "email_open",
          attendeeId: send.attendeeId,
          campaignId: send.campaignId,
          metadata: { emailSendId: id },
        });
      }
      if (updateData.clickedAt) {
        await this.createAnalyticsEvent({
          eventType: "email_click",
          attendeeId: send.attendeeId,
          campaignId: send.campaignId,
          metadata: { emailSendId: id },
        });
      }
    }
  }

  async getEmailSendStats(campaignId: string): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  }> {
    const sends = Array.from(this.emailSends.values()).filter(send => send.campaignId === campaignId);
    
    return {
      sent: sends.length,
      opened: sends.filter(send => send.openedAt).length,
      clicked: sends.filter(send => send.clickedAt).length,
      bounced: sends.filter(send => send.bounced).length,
    };
  }

  // Content Preview methods
  async getContentPreviews(eventId: string): Promise<ContentPreview[]> {
    return Array.from(this.contentPreviews.values())
      .filter(preview => preview.eventId === eventId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createContentPreview(insertPreview: InsertContentPreview): Promise<ContentPreview> {
    const id = randomUUID();
    const preview: ContentPreview = {
      ...insertPreview,
      id,
      createdAt: new Date(),
    };
    this.contentPreviews.set(id, preview);
    return preview;
  }

  // Analytics methods
  async createAnalyticsEvent(insertEvent: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const id = randomUUID();
    const event: AnalyticsEvent = {
      ...insertEvent,
      id,
      timestamp: new Date(),
    };
    this.analyticsEvents.set(id, event);
    return event;
  }

  async getAnalyticsEvents(filters?: {
    eventType?: string;
    eventId?: string;
    attendeeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AnalyticsEvent[]> {
    let events = Array.from(this.analyticsEvents.values());

    if (filters) {
      if (filters.eventType) {
        events = events.filter(event => event.eventType === filters.eventType);
      }
      if (filters.eventId) {
        events = events.filter(event => event.eventId === filters.eventId);
      }
      if (filters.attendeeId) {
        events = events.filter(event => event.attendeeId === filters.attendeeId);
      }
      if (filters.startDate) {
        events = events.filter(event => new Date(event.timestamp!) >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(event => new Date(event.timestamp!) <= filters.endDate!);
      }
    }

    return events.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async getEngagementMetrics(days: number): Promise<{
    registrations: { date: string; count: number }[];
    attendance: { date: string; count: number }[];
    engagement: { date: string; score: number }[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.getAnalyticsEvents({ startDate, endDate });

    // Create date range array
    const dateRange: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().split('T')[0]);
    }

    // Group events by date and type
    const registrationsByDate = new Map<string, number>();
    const attendanceByDate = new Map<string, number>();
    const engagementByDate = new Map<string, number[]>();

    events.forEach(event => {
      const date = event.timestamp!.toISOString().split('T')[0];
      
      switch (event.eventType) {
        case 'registration':
          registrationsByDate.set(date, (registrationsByDate.get(date) || 0) + 1);
          break;
        case 'attendance':
          attendanceByDate.set(date, (attendanceByDate.get(date) || 0) + 1);
          break;
        case 'email_open':
        case 'email_click':
          if (!engagementByDate.has(date)) {
            engagementByDate.set(date, []);
          }
          engagementByDate.get(date)!.push(event.eventType === 'email_click' ? 2 : 1);
          break;
      }
    });

    return {
      registrations: dateRange.map(date => ({
        date,
        count: registrationsByDate.get(date) || 0,
      })),
      attendance: dateRange.map(date => ({
        date,
        count: attendanceByDate.get(date) || 0,
      })),
      engagement: dateRange.map(date => {
        const scores = engagementByDate.get(date) || [];
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return { date, score: Math.round(avgScore * 10) / 10 };
      }),
    };
  }
}

export const storage = new MemStorage();
