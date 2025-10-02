import * as cron from "node-cron";
import { storage } from "../storage";
import { emailService } from "./emailService";
import { aiPersonalizationService } from "./aiPersonalization";

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeScheduledTasks();
  }

  private initializeScheduledTasks() {
    // Check for scheduled campaigns every minute
    cron.schedule("* * * * *", async () => {
      await this.processScheduledCampaigns();
    });

    // Update engagement scores daily at midnight
    cron.schedule("0 0 * * *", async () => {
      await this.updateEngagementScores();
    });

    // Send event reminders (check every hour)
    cron.schedule("0 * * * *", async () => {
      await this.sendEventReminders();
    });

    // Clean up old analytics data weekly
    cron.schedule("0 0 * * 0", async () => {
      await this.cleanupOldData();
    });
  }

  async processScheduledCampaigns(): Promise<void> {
    try {
      const scheduledCampaigns = await storage.getScheduledCampaigns();
      
      for (const campaign of scheduledCampaigns) {
        console.log(`Processing scheduled campaign: ${campaign.name}`);
        
        // Mark as sending
        await storage.updateEmailCampaign(campaign.id, {
          status: "sending",
        });

        // Send the campaign
        const result = await emailService.sendBulkCampaign(campaign.id);
        
        console.log(`Campaign ${campaign.name} completed: ${result.sent} sent, ${result.failed} failed`);
        
        if (result.errors.length > 0) {
          console.error("Campaign errors:", result.errors);
        }
      }
    } catch (error) {
      console.error("Error processing scheduled campaigns:", error);
    }
  }

  async updateEngagementScores(): Promise<void> {
    try {
      console.log("Updating engagement scores for all attendees");
      
      const attendees = await storage.getAttendees();
      
      for (const attendee of attendees) {
        // Get recent activity for the attendee
        const recentEvents = await storage.getAnalyticsEvents({
          attendeeId: attendee.id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        });

        const emailOpens = recentEvents.filter(e => e.eventType === "email_open").length;
        const emailClicks = recentEvents.filter(e => e.eventType === "email_click").length;
        const eventsAttended = recentEvents.filter(e => e.eventType === "attendance").length;
        const registrations = recentEvents.filter(e => e.eventType === "registration").length;

        // Calculate new engagement score using AI
        const newScore = await aiPersonalizationService.calculateEngagementScore(attendee, {
          emailOpens,
          emailClicks,
          eventsAttended,
          registrationFrequency: registrations,
        });

        // Update the attendee's engagement score
        await storage.updateAttendeeEngagement(attendee.id, newScore);
      }
      
      console.log(`Updated engagement scores for ${attendees.length} attendees`);
    } catch (error) {
      console.error("Error updating engagement scores:", error);
    }
  }

  async sendEventReminders(): Promise<void> {
    try {
      const events = await storage.getEvents();
      const now = new Date();
      
      for (const event of events) {
        if (event.status !== "published" && event.status !== "live") continue;
        
        const eventDate = new Date(event.startDate);
        const timeUntilEvent = eventDate.getTime() - now.getTime();
        const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);
        
        // Send reminders at 24 hours, 2 hours, and 30 minutes before event
        const reminderTimes = [24, 2, 0.5];
        
        for (const reminderHours of reminderTimes) {
          const shouldSendReminder = 
            hoursUntilEvent <= reminderHours && 
            hoursUntilEvent > (reminderHours - 1); // Within the hour window
          
          if (shouldSendReminder) {
            await this.sendEventReminder(event.id, reminderHours);
          }
        }
      }
    } catch (error) {
      console.error("Error sending event reminders:", error);
    }
  }

  private async sendEventReminder(eventId: string, hoursBeforeEvent: number): Promise<void> {
    try {
      // Get reminder template
      const templates = await storage.getEmailTemplates();
      const reminderTemplate = templates.find(t => t.type === "reminder");
      
      if (!reminderTemplate) {
        console.log("No reminder template found");
        return;
      }

      // Create automatic reminder campaign
      const campaignName = `Auto-Reminder ${hoursBeforeEvent}h before event`;
      
      const campaign = await storage.createEmailCampaign({
        name: campaignName,
        type: "reminder",
        eventId,
        templateId: reminderTemplate.id,
        subject: reminderTemplate.subject,
        content: reminderTemplate.content,
        status: "scheduled",
        scheduledAt: new Date(),
      });

      console.log(`Created automatic reminder campaign: ${campaignName}`);
      
      // Send immediately
      const result = await emailService.sendBulkCampaign(campaign.id);
      console.log(`Reminder sent: ${result.sent} emails, ${result.failed} failed`);
      
    } catch (error) {
      console.error("Error sending event reminder:", error);
    }
  }

  async scheduleCustomCampaign(campaignId: string, sendAt: Date): Promise<void> {
    const taskId = `campaign_${campaignId}`;
    
    // Remove existing task if any
    const existingTask = this.tasks.get(taskId);
    if (existingTask) {
      existingTask.destroy();
    }

    // Create new scheduled task
    const cronExpression = this.dateToCronExpression(sendAt);
    
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Executing scheduled campaign: ${campaignId}`);
        const result = await emailService.sendBulkCampaign(campaignId);
        console.log(`Campaign completed: ${result.sent} sent, ${result.failed} failed`);
        
        // Remove the task after execution
        this.tasks.delete(taskId);
        task.destroy();
      } catch (error) {
        console.error(`Error executing scheduled campaign ${campaignId}:`, error);
      }
    }, {
      scheduled: false,
    });

    this.tasks.set(taskId, task);
    task.start();
    
    console.log(`Scheduled campaign ${campaignId} for ${sendAt.toISOString()}`);
  }

  async cancelScheduledCampaign(campaignId: string): Promise<void> {
    const taskId = `campaign_${campaignId}`;
    const task = this.tasks.get(taskId);
    
    if (task) {
      task.destroy();
      this.tasks.delete(taskId);
      console.log(`Cancelled scheduled campaign: ${campaignId}`);
    }
  }

  private dateToCronExpression(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Create a cron expression for a specific date and time
    return `${minute} ${hour} ${day} ${month} *`;
  }

  private async cleanupOldData(): Promise<void> {
    try {
      console.log("Cleaning up old analytics data");
      
      // This would typically clean up analytics events older than a certain period
      // For now, we'll just log the action since we're using in-memory storage
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep last 90 days
      
      const allEvents = await storage.getAnalyticsEvents();
      const oldEvents = allEvents.filter(event => 
        new Date(event.timestamp!) < cutoffDate
      );
      
      console.log(`Found ${oldEvents.length} old analytics events (would be cleaned up in production)`);
    } catch (error) {
      console.error("Error cleaning up old data:", error);
    }
  }

  shutdown(): void {
    console.log("Shutting down scheduler service");
    
    // Stop all scheduled tasks
    this.tasks.forEach((task, taskId) => {
      task.destroy();
      console.log(`Stopped scheduled task: ${taskId}`);
    });
    
    this.tasks.clear();
  }
}

// Create singleton instance
export const schedulerService = new SchedulerService();

// Graceful shutdown
process.on('SIGTERM', () => {
  schedulerService.shutdown();
});

process.on('SIGINT', () => {
  schedulerService.shutdown();
});
