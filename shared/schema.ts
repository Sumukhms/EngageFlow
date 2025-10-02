import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  timezone: text("timezone").default("UTC"),
  maxAttendees: integer("max_attendees"),
  isPublic: boolean("is_public").default(true),
  status: text("status").$type<"draft" | "published" | "live" | "completed" | "cancelled">().default("draft"),
  imageUrl: text("image_url"),
  location: text("location"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendees table
export const attendees = pgTable("attendees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  name: text("name").notNull(),
  company: text("company"),
  jobTitle: text("job_title"),
  interests: text("interests").array(),
  engagementScore: integer("engagement_score").default(0),
  registrationDate: timestamp("registration_date").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  preferences: jsonb("preferences").$type<{
    emailFrequency: "daily" | "weekly" | "minimal";
    contentTypes: string[];
    timezone: string;
  }>(),
});

// Event registrations table
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  attendeeId: varchar("attendee_id").notNull().references(() => attendees.id),
  registrationDate: timestamp("registration_date").defaultNow(),
  attended: boolean("attended").default(false),
  attendanceTime: integer("attendance_time_minutes"),
  feedback: jsonb("feedback").$type<{
    rating: number;
    comments: string;
    topics: string[];
  }>(),
});

// Email campaigns table
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").$type<"reminder" | "welcome" | "follow-up" | "content-preview" | "thank-you">().notNull(),
  eventId: varchar("event_id").references(() => events.id),
  templateId: varchar("template_id").references(() => emailTemplates.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: text("status").$type<"draft" | "scheduled" | "sending" | "sent" | "cancelled">().default("draft"),
  targetAudience: jsonb("target_audience").$type<{
    interests: string[];
    engagementScore: { min: number; max: number };
    attendanceHistory: "all" | "attended" | "not-attended";
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").$type<"reminder" | "welcome" | "follow-up" | "content-preview" | "thank-you">().notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  variables: text("variables").array(), // Available template variables
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email sends table (for tracking)
export const emailSends = pgTable("email_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id),
  attendeeId: varchar("attendee_id").notNull().references(() => attendees.id),
  sentAt: timestamp("sent_at").notNull(),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bounced: boolean("bounced").default(false),
  unsubscribed: boolean("unsubscribed").default(false),
});

// Content previews table
export const contentPreviews = pgTable("content_previews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").$type<"slides" | "agenda" | "speaker-bio" | "resources" | "recording">().notNull(),
  url: text("url"),
  fileData: text("file_data"), // Base64 encoded file data
  targetInterests: text("target_interests").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics events table
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").$type<"registration" | "email_open" | "email_click" | "attendance" | "engagement">().notNull(),
  attendeeId: varchar("attendee_id").references(() => attendees.id),
  eventId: varchar("event_id").references(() => events.id),
  campaignId: varchar("campaign_id").references(() => emailCampaigns.id),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendeeSchema = createInsertSchema(attendees).omit({
  id: true,
  registrationDate: true,
  lastActivity: true,
  engagementScore: true,
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registrationDate: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentPreviewSchema = createInsertSchema(contentPreviews).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

// Types
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Attendee = typeof attendees.$inferSelect;
export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type EmailSend = typeof emailSends.$inferSelect;

export type ContentPreview = typeof contentPreviews.$inferSelect;
export type InsertContentPreview = z.infer<typeof insertContentPreviewSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// User schema (from existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
