import type { EmailCampaign, EmailTemplate, Attendee, Event } from "@shared/schema";
import { storage } from "../storage";
import { aiPersonalizationService } from "./aiPersonalization";

// Email service interface for different providers
interface EmailProvider {
  sendEmail(to: string, subject: string, content: string): Promise<boolean>;
}

// Resend implementation
class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_ENV_VAR || "";
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EventBoost <events@eventboost.com>",
          to: [to],
          subject,
          html: content,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Resend email failed:", error);
      return false;
    }
  }
}

// SendGrid implementation
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY_ENV_VAR || "";
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject,
          }],
          from: { email: "events@eventboost.com", name: "EventBoost" },
          content: [{
            type: "text/html",
            value: content,
          }],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("SendGrid email failed:", error);
      return false;
    }
  }
}

// Mock provider for development
class MockProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    console.log(`Mock email sent to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content.substring(0, 100)}...`);
    return true;
  }
}

export class EmailService {
  private provider: EmailProvider;

  constructor() {
    // Choose provider based on available API keys
    if (process.env.RESEND_API_KEY || process.env.RESEND_API_KEY_ENV_VAR) {
      this.provider = new ResendProvider();
    } else if (process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY_ENV_VAR) {
      this.provider = new SendGridProvider();
    } else {
      this.provider = new MockProvider();
    }
  }

  async sendCampaignEmail(campaign: EmailCampaign, attendee: Attendee): Promise<boolean> {
    try {
      // Get the template
      const template = campaign.templateId 
        ? await storage.getEmailTemplate(campaign.templateId)
        : null;

      // Get event details if applicable
      const event = campaign.eventId 
        ? await storage.getEvent(campaign.eventId)
        : undefined;

      let subject = campaign.subject;
      let content = campaign.content;

      // Apply AI personalization if template exists
      if (template) {
        try {
          const personalized = await aiPersonalizationService.personalizeEmailContent({
            attendee,
            event,
            template,
          });
          
          subject = personalized.subject;
          content = personalized.content;
        } catch (error) {
          console.error("Personalization failed, using template:", error);
        }
      }

      // Apply template variables
      subject = this.applyTemplateVariables(subject, attendee, event);
      content = this.applyTemplateVariables(content, attendee, event);

      // Send the email
      const success = await this.provider.sendEmail(attendee.email, subject, content);

      if (success) {
        // Track the send
        await storage.createEmailSend({
          campaignId: campaign.id,
          attendeeId: attendee.id,
          sentAt: new Date(),
          openedAt: null,
          clickedAt: null,
          bounced: false,
          unsubscribed: false,
        });

        // Update attendee's last activity
        await storage.updateAttendee(attendee.id, {
          lastActivity: new Date(),
        });
      }

      return success;
    } catch (error) {
      console.error("Failed to send campaign email:", error);
      return false;
    }
  }

  async sendBulkCampaign(campaignId: string): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const campaign = await storage.getEmailCampaign(campaignId);
    if (!campaign) {
      return { sent: 0, failed: 1, errors: ["Campaign not found"] };
    }

    // Get target attendees based on campaign criteria
    const attendees = await this.getTargetAttendees(campaign);
    
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < attendees.length; i += batchSize) {
      const batch = attendees.slice(i, i + batchSize);
      
      const promises = batch.map(async (attendee) => {
        try {
          const success = await this.sendCampaignEmail(campaign, attendee);
          if (success) {
            sent++;
          } else {
            failed++;
            errors.push(`Failed to send to ${attendee.email}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error sending to ${attendee.email}: ${error}`);
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < attendees.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update campaign status
    await storage.updateEmailCampaign(campaignId, {
      status: "sent",
      sentAt: new Date(),
    });

    return { sent, failed, errors };
  }

  private async getTargetAttendees(campaign: EmailCampaign): Promise<Attendee[]> {
    let attendees = await storage.getAttendees();

    // If campaign is for a specific event, filter by registrations
    if (campaign.eventId) {
      const registrations = await storage.getEventRegistrations(campaign.eventId);
      const registeredAttendeeIds = new Set(registrations.map(r => r.attendeeId));
      attendees = attendees.filter(a => registeredAttendeeIds.has(a.id));
    }

    // Apply target audience filters
    if (campaign.targetAudience) {
      const { interests, engagementScore, attendanceHistory } = campaign.targetAudience;

      if (interests && interests.length > 0) {
        attendees = attendees.filter(attendee => 
          attendee.interests?.some(interest => interests.includes(interest))
        );
      }

      if (engagementScore) {
        attendees = attendees.filter(attendee => 
          (attendee.engagementScore || 0) >= engagementScore.min &&
          (attendee.engagementScore || 0) <= engagementScore.max
        );
      }

      if (attendanceHistory && attendanceHistory !== "all" && campaign.eventId) {
        const registrations = await storage.getEventRegistrations(campaign.eventId);
        const attendedSet = new Set(
          registrations
            .filter(r => attendanceHistory === "attended" ? r.attended : !r.attended)
            .map(r => r.attendeeId)
        );
        attendees = attendees.filter(a => attendedSet.has(a.id));
      }
    }

    return attendees;
  }

  private applyTemplateVariables(
    template: string, 
    attendee: Attendee, 
    event?: Event
  ): string {
    let result = template;

    // Attendee variables
    result = result.replace(/\{\{attendeeName\}\}/g, attendee.name);
    result = result.replace(/\{\{attendeeEmail\}\}/g, attendee.email);
    result = result.replace(/\{\{attendeeCompany\}\}/g, attendee.company || "");
    result = result.replace(/\{\{attendeeJobTitle\}\}/g, attendee.jobTitle || "");

    // Event variables
    if (event) {
      result = result.replace(/\{\{eventTitle\}\}/g, event.title);
      result = result.replace(/\{\{eventDescription\}\}/g, event.description || "");
      result = result.replace(/\{\{eventDate\}\}/g, new Date(event.startDate).toLocaleDateString());
      result = result.replace(/\{\{eventTime\}\}/g, new Date(event.startDate).toLocaleTimeString());
      result = result.replace(/\{\{eventLocation\}\}/g, event.location || "Virtual");

      // Calculate time until event
      const timeUntil = this.calculateTimeUntil(new Date(event.startDate));
      result = result.replace(/\{\{timeUntil\}\}/g, timeUntil);
    }

    // Add placeholder links for dynamic content
    result = result.replace(/\{\{resourceLinks\}\}/g, "Resource links will be available after the event");
    result = result.replace(/\{\{feedbackLink\}\}/g, "https://eventboost.com/feedback");

    return result;
  }

  private calculateTimeUntil(eventDate: Date): string {
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff <= 0) return "now";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return "less than an hour";
    }
  }

  async trackEmailOpen(emailSendId: string): Promise<void> {
    await storage.updateEmailSend(emailSendId, {
      openedAt: new Date(),
    });
  }

  async trackEmailClick(emailSendId: string): Promise<void> {
    await storage.updateEmailSend(emailSendId, {
      clickedAt: new Date(),
    });
  }
}

export const emailService = new EmailService();
