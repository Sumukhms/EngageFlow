import { StatsGrid } from "@/components/dashboard/stats-grid";
import { EngagementChart } from "@/components/dashboard/engagement-chart";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { CampaignStatus } from "@/components/dashboard/campaign-status";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AttendeeInsights } from "@/components/dashboard/attendee-insights";
import { EmailTemplates } from "@/components/dashboard/email-templates";

export default function Dashboard() {
  return (
    <div className="space-y-6">
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
