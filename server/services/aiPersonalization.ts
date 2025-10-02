import OpenAI from "openai";
import type { Attendee, Event, EmailTemplate } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface PersonalizationContext {
  attendee: Attendee;
  event?: Event;
  template: EmailTemplate;
  previousEngagement?: {
    emailOpens: number;
    emailClicks: number;
    eventsAttended: number;
  };
}

export interface PersonalizedContent {
  subject: string;
  content: string;
  sendTime?: string;
  recommendations: string[];
}

export class AIPersonalizationService {
  async personalizeEmailContent(context: PersonalizationContext): Promise<PersonalizedContent> {
    try {
      const prompt = this.buildPersonalizationPrompt(context);

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert email marketing specialist focused on event engagement. Create personalized email content that maximizes engagement and attendance. Respond with JSON containing 'subject', 'content', 'sendTime', and 'recommendations' fields."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      return {
        subject: result.subject || context.template.subject,
        content: result.content || context.template.content,
        sendTime: result.sendTime,
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error("AI personalization failed:", error);
      // Fallback to template content
      return {
        subject: context.template.subject,
        content: context.template.content,
        recommendations: ["Use default template content due to AI service unavailability"],
      };
    }
  }

  async generateEventContentSuggestions(event: Event, attendeeInterests: string[]): Promise<{
    contentTopics: string[];
    speakerSuggestions: string[];
    agenda: string[];
  }> {
    try {
      const prompt = `
        Generate content suggestions for an event based on attendee interests.
        
        Event: ${event.title}
        Description: ${event.description}
        Attendee Interests: ${attendeeInterests.join(", ")}
        
        Provide suggestions for:
        1. Content topics that would engage attendees
        2. Speaker suggestions or expertise areas
        3. Agenda items or session ideas
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an event planning expert. Generate relevant, engaging content suggestions based on the event details and attendee interests. Respond with JSON containing 'contentTopics', 'speakerSuggestions', and 'agenda' arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      return {
        contentTopics: result.contentTopics || [],
        speakerSuggestions: result.speakerSuggestions || [],
        agenda: result.agenda || [],
      };
    } catch (error) {
      console.error("Content suggestions generation failed:", error);
      return {
        contentTopics: [],
        speakerSuggestions: [],
        agenda: [],
      };
    }
  }

  async calculateEngagementScore(attendee: Attendee, recentActivity: {
    emailOpens: number;
    emailClicks: number;
    eventsAttended: number;
    registrationFrequency: number;
  }): Promise<number> {
    try {
      const prompt = `
        Calculate an engagement score (0-100) for an event attendee based on their profile and activity.
        
        Attendee Profile:
        - Name: ${attendee.name}
        - Company: ${attendee.company}
        - Interests: ${attendee.interests?.join(", ") || "None specified"}
        - Current Score: ${attendee.engagementScore}
        
        Recent Activity:
        - Email Opens: ${recentActivity.emailOpens}
        - Email Clicks: ${recentActivity.emailClicks}
        - Events Attended: ${recentActivity.eventsAttended}
        - Registration Frequency: ${recentActivity.registrationFrequency}
        
        Consider factors like:
        - Email engagement rates
        - Event attendance consistency
        - Profile completeness
        - Registration patterns
        
        Provide a numeric score and brief explanation.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a data analyst specializing in attendee engagement metrics. Calculate a comprehensive engagement score and provide reasoning. Respond with JSON containing 'score' (number 0-100) and 'reasoning' (string)."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return Math.max(0, Math.min(100, Math.round(result.score || 50)));
    } catch (error) {
      console.error("Engagement score calculation failed:", error);
      // Fallback calculation
      const baseScore = attendee.engagementScore || 0;
      const activityBonus = (recentActivity.emailOpens * 2) + (recentActivity.emailClicks * 5) + (recentActivity.eventsAttended * 10);
      return Math.max(0, Math.min(100, baseScore + activityBonus));
    }
  }

  async optimizeSendTiming(attendee: Attendee, campaignType: string): Promise<{
    recommendedTime: string;
    timezone: string;
    reasoning: string;
  }> {
    try {
      const prompt = `
        Recommend the optimal send time for an email campaign based on attendee profile and campaign type.
        
        Attendee:
        - Timezone: ${attendee.preferences?.timezone || "UTC"}
        - Job Title: ${attendee.jobTitle || "Not specified"}
        - Company: ${attendee.company || "Not specified"}
        
        Campaign Type: ${campaignType}
        
        Consider:
        - Professional work hours
        - Campaign urgency (reminders vs. follow-ups)
        - Time zone preferences
        - Industry standards
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a digital marketing timing specialist. Recommend optimal email send times based on recipient profiles and campaign types. Respond with JSON containing 'recommendedTime' (HH:MM format), 'timezone', and 'reasoning'."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 256,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      return {
        recommendedTime: result.recommendedTime || "09:00",
        timezone: result.timezone || attendee.preferences?.timezone || "UTC",
        reasoning: result.reasoning || "Default professional hours",
      };
    } catch (error) {
      console.error("Send timing optimization failed:", error);
      return {
        recommendedTime: "09:00",
        timezone: attendee.preferences?.timezone || "UTC",
        reasoning: "Default timing due to AI service unavailability",
      };
    }
  }

  private buildPersonalizationPrompt(context: PersonalizationContext): string {
    const { attendee, event, template, previousEngagement } = context;

    return `
      Personalize this email template for maximum engagement:
      
      ATTENDEE PROFILE:
      - Name: ${attendee.name}
      - Company: ${attendee.company || "Not specified"}
      - Job Title: ${attendee.jobTitle || "Not specified"}
      - Interests: ${attendee.interests?.join(", ") || "General"}
      - Engagement Score: ${attendee.engagementScore}/100
      
      ${event ? `EVENT DETAILS:
      - Title: ${event.title}
      - Date: ${event.startDate}
      - Description: ${event.description}
      - Tags: ${event.tags?.join(", ") || "None"}` : ""}
      
      TEMPLATE:
      - Type: ${template.type}
      - Subject: ${template.subject}
      - Content: ${template.content}
      
      ${previousEngagement ? `ENGAGEMENT HISTORY:
      - Email Opens: ${previousEngagement.emailOpens}
      - Email Clicks: ${previousEngagement.emailClicks}
      - Events Attended: ${previousEngagement.eventsAttended}` : ""}
      
      PERSONALIZATION REQUIREMENTS:
      1. Customize subject line for higher open rates
      2. Personalize content based on interests and engagement level
      3. Suggest optimal send time
      4. Provide recommendations for further engagement
      
      Focus on:
      - Personal relevance to their interests
      - Professional value proposition
      - Clear call-to-action
      - Engagement-driving language
    `;
  }
}

export const aiPersonalizationService = new AIPersonalizationService();
