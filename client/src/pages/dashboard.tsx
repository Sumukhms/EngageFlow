import { StatsGrid } from "@/components/dashboard/stats-grid";
import { EngagementChart } from "@/components/dashboard/engagement-chart";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { CampaignStatus } from "@/components/dashboard/campaign-status";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AttendeeInsights } from "@/components/dashboard/attendee-insights";
import { EmailTemplates } from "@/components/dashboard/email-templates";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent p-8 md:p-12 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
            Welcome to EventBoost 🎉
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-6">
            Your all-in-one platform for event engagement. Track registrations, send personalized reminders, and boost attendance with AI-powered insights.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/events" className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors">
              Create Event
            </a>
            <a href="/register" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors">
              View Public Page
            </a>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Overview */}
      <StatsGrid />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Events */}
        <div className="lg:col-span-2 space-y-6">
          <EngagementChart />
          <UpcomingEvents />
        </div>
        
        {/* Right Column - Activity and Quick Actions */}
        <div className="space-y-6">
          <CampaignStatus />
          <RecentActivity />
        </div>
      </div>
      
      {/* Attendee Insights */}
      <AttendeeInsights />
      
      {/* Email Templates */}
      <EmailTemplates />
    </div>
  );
}
