import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, UserPlus, Eye, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  activeEvents: number;
  totalRegistrations: number;
  emailOpenRate: number;
  attendanceRate: number;
}

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="w-12 h-6 rounded-full" />
            </div>
            <Skeleton className="w-16 h-8 mb-1" />
            <Skeleton className="w-24 h-4" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Events",
      value: stats?.activeEvents || 0,
      icon: CalendarCheck,
      change: "+12%",
      color: "gradient-primary",
    },
    {
      title: "Total Registrations",
      value: stats?.totalRegistrations?.toLocaleString() || "0",
      icon: UserPlus,
      change: "+24%",
      color: "gradient-accent",
    },
    {
      title: "Avg. Email Open Rate",
      value: `${stats?.emailOpenRate || 0}%`,
      icon: Eye,
      change: "+8%",
      color: "bg-chart-4",
    },
    {
      title: "Attendance Rate",
      value: `${stats?.attendanceRate || 0}%`,
      icon: CheckCircle,
      change: "+15%",
      color: "bg-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={stat.title} 
          className="hover-lift cursor-pointer"
          data-testid={`stat-card-${index}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-heading font-bold text-foreground mb-1">
              {stat.value}
            </h3>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
