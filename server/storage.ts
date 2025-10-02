import { 
  type Event, type InsertEvent,
  type Attendee, type InsertAttendee,
  type EventRegistration, type InsertEventRegistration,
  type EmailCampaign, type InsertEmailCampaign,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailSend,
  type ContentPreview, type InsertContentPreview,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type User, type InsertUser,
  events,
  attendees,
  eventRegistrations,
  emailCampaigns,
  emailTemplates,
  emailSends,
  contentPreviews,
  analyticsEvents,
  users
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, gte, lte, desc, sql as drizzleSql } from "drizzle-orm";

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
      title: insertEvent.title,
      description: insertEvent.description ?? null,
      startDate: insertEvent.startDate,
      endDate: insertEvent.endDate ?? null,
      timezone: insertEvent.timezone ?? null,
      maxAttendees: insertEvent.maxAttendees ?? null,
      isPublic: insertEvent.isPublic ?? null,
      status: (insertEvent.status as any) ?? null,
      imageUrl: insertEvent.imageUrl ?? null,
      location: insertEvent.location ?? null,
      tags: insertEvent.tags ?? null,
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
      email: insertAttendee.email,
      name: insertAttendee.name,
      company: insertAttendee.company ?? null,
      jobTitle: insertAttendee.jobTitle ?? null,
      interests: insertAttendee.interests ?? null,
      preferences: (insertAttendee.preferences as any) ?? null,
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
      eventId: insertRegistration.eventId,
      attendeeId: insertRegistration.attendeeId,
      attended: insertRegistration.attended ?? null,
      attendanceTime: insertRegistration.attendanceTime ?? null,
      feedback: (insertRegistration.feedback as any) ?? null,
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
      name: insertCampaign.name,
      type: insertCampaign.type as any,
      subject: insertCampaign.subject,
      content: insertCampaign.content,
      status: (insertCampaign.status as any) ?? null,
      eventId: insertCampaign.eventId ?? null,
      templateId: insertCampaign.templateId ?? null,
      scheduledAt: insertCampaign.scheduledAt ?? null,
      targetAudience: (insertCampaign.targetAudience as any) ?? null,
      id,
      createdAt: new Date(),
      sentAt: null,
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
      name: insertTemplate.name,
      type: insertTemplate.type as any,
      subject: insertTemplate.subject,
      content: insertTemplate.content,
      variables: insertTemplate.variables ?? null,
      isActive: insertTemplate.isActive ?? null,
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
      eventId: insertPreview.eventId,
      title: insertPreview.title,
      contentType: insertPreview.contentType as any,
      description: insertPreview.description ?? null,
      url: insertPreview.url ?? null,
      fileData: insertPreview.fileData ?? null,
      targetInterests: insertPreview.targetInterests ?? null,
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
      eventType: insertEvent.eventType as any,
      eventId: insertEvent.eventId ?? null,
      attendeeId: insertEvent.attendeeId ?? null,
      campaignId: insertEvent.campaignId ?? null,
      metadata: insertEvent.metadata ?? null,
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

class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const sql = neon(process.env.DATABASE_URL, {
      fetchOptions: {
        cache: 'no-store',
      },
    });
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values([user]).returning();
    return result[0];
  }

  async getEvents(): Promise<Event[]> {
    return await this.db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await this.db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await this.db.insert(events).values([event]).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined> {
    const result = await this.db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await this.db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async getAttendees(): Promise<Attendee[]> {
    return await this.db.select().from(attendees).orderBy(desc(attendees.registrationDate));
  }

  async getAttendee(id: string): Promise<Attendee | undefined> {
    const result = await this.db.select().from(attendees).where(eq(attendees.id, id));
    return result[0];
  }

  async getAttendeeByEmail(email: string): Promise<Attendee | undefined> {
    const result = await this.db.select().from(attendees).where(eq(attendees.email, email));
    return result[0];
  }

  async createAttendee(attendee: InsertAttendee): Promise<Attendee> {
    const result = await this.db.insert(attendees).values([attendee]).returning();
    return result[0];
  }

  async updateAttendee(id: string, attendeeUpdate: Partial<Attendee>): Promise<Attendee | undefined> {
    const result = await this.db
      .update(attendees)
      .set({ ...attendeeUpdate, lastActivity: new Date() })
      .where(eq(attendees.id, id))
      .returning();
    return result[0];
  }

  async updateAttendeeEngagement(id: string, score: number): Promise<void> {
    await this.db
      .update(attendees)
      .set({ engagementScore: score, lastActivity: new Date() })
      .where(eq(attendees.id, id));
  }

  async getEventRegistrations(eventId?: string): Promise<EventRegistration[]> {
    if (eventId) {
      return await this.db
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId))
        .orderBy(desc(eventRegistrations.registrationDate));
    }
    return await this.db.select().from(eventRegistrations).orderBy(desc(eventRegistrations.registrationDate));
  }

  async getAttendeeRegistrations(attendeeId: string): Promise<EventRegistration[]> {
    return await this.db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.attendeeId, attendeeId))
      .orderBy(desc(eventRegistrations.registrationDate));
  }

  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const result = await this.db.insert(eventRegistrations).values([registration]).returning();
    
    await this.createAnalyticsEvent({
      eventType: "registration",
      attendeeId: registration.attendeeId,
      eventId: registration.eventId,
      metadata: { registrationId: result[0].id },
    });
    
    return result[0];
  }

  async updateEventRegistration(id: string, registration: Partial<EventRegistration>): Promise<EventRegistration | undefined> {
    const result = await this.db
      .update(eventRegistrations)
      .set(registration)
      .where(eq(eventRegistrations.id, id))
      .returning();

    if (registration.attended === true && result[0]) {
      await this.createAnalyticsEvent({
        eventType: "attendance",
        attendeeId: result[0].attendeeId,
        eventId: result[0].eventId,
        metadata: { registrationId: id, attendanceTime: registration.attendanceTime },
      });
    }

    return result[0];
  }

  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return await this.db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const result = await this.db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return result[0];
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const result = await this.db.insert(emailCampaigns).values([campaign]).returning();
    return result[0];
  }

  async updateEmailCampaign(id: string, campaign: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const result = await this.db
      .update(emailCampaigns)
      .set(campaign)
      .where(eq(emailCampaigns.id, id))
      .returning();
    return result[0];
  }

  async getScheduledCampaigns(): Promise<EmailCampaign[]> {
    const now = new Date();
    return await this.db
      .select()
      .from(emailCampaigns)
      .where(and(
        eq(emailCampaigns.status, "scheduled"),
        lte(emailCampaigns.scheduledAt, now)
      ));
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await this.db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true))
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const result = await this.db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return result[0];
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await this.db.insert(emailTemplates).values([template]).returning();
    return result[0];
  }

  async updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const result = await this.db
      .update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return result[0];
  }

  async createEmailSend(send: Omit<EmailSend, 'id'>): Promise<EmailSend> {
    const result = await this.db.insert(emailSends).values([send]).returning();
    return result[0];
  }

  async updateEmailSend(id: string, send: Partial<EmailSend>): Promise<void> {
    await this.db.update(emailSends).set(send).where(eq(emailSends.id, id));
  }

  async getEmailSendStats(campaignId: string): Promise<{ sent: number; opened: number; clicked: number; bounced: number }> {
    const sends = await this.db
      .select()
      .from(emailSends)
      .where(eq(emailSends.campaignId, campaignId));

    return {
      sent: sends.length,
      opened: sends.filter(s => s.openedAt !== null).length,
      clicked: sends.filter(s => s.clickedAt !== null).length,
      bounced: sends.filter(s => s.bounced === true).length,
    };
  }

  async getContentPreviews(eventId: string): Promise<ContentPreview[]> {
    return await this.db
      .select()
      .from(contentPreviews)
      .where(eq(contentPreviews.eventId, eventId))
      .orderBy(desc(contentPreviews.createdAt));
  }

  async createContentPreview(preview: InsertContentPreview): Promise<ContentPreview> {
    const result = await this.db.insert(contentPreviews).values([preview]).returning();
    return result[0];
  }

  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const result = await this.db.insert(analyticsEvents).values([event]).returning();
    return result[0];
  }

  async getAnalyticsEvents(filters?: {
    eventType?: string;
    eventId?: string;
    attendeeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AnalyticsEvent[]> {
    let query = this.db.select().from(analyticsEvents);

    const conditions = [];
    if (filters?.eventType) conditions.push(eq(analyticsEvents.eventType, filters.eventType as any));
    if (filters?.eventId) conditions.push(eq(analyticsEvents.eventId, filters.eventId));
    if (filters?.attendeeId) conditions.push(eq(analyticsEvents.attendeeId, filters.attendeeId));
    if (filters?.startDate) conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
    if (filters?.endDate) conditions.push(lte(analyticsEvents.timestamp, filters.endDate));

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(analyticsEvents.timestamp));
    }

    return await query.orderBy(desc(analyticsEvents.timestamp));
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

    const dateRange: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().split('T')[0]);
    }

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

// Using MemStorage for now due to local database setup
// Switch to DbStorage when using Neon cloud database
export const storage = (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')) 
  ? new DbStorage() 
  : new MemStorage();
