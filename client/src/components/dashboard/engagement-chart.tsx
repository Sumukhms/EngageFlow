import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface EngagementMetrics {
  registrations: { date: string; count: number }[];
  attendance: { date: string; count: number }[];
  engagement: { date: string; score: number }[];
}

export function EngagementChart() {
  const [timeRange, setTimeRange] = useState(7);
  
  const { data: metrics, isLoading } = useQuery<EngagementMetrics>({
    queryKey: ["/api/analytics/metrics", { days: timeRange }],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="w-48 h-6 mb-2" />
              <Skeleton className="w-32 h-4" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="w-8 h-6" />
              <Skeleton className="w-8 h-6" />
              <Skeleton className="w-8 h-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
    );
  }

  // Combine data for chart
  const chartData = metrics?.registrations.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    registrations: item.count,
    attendance: metrics.attendance[index]?.count || 0,
    engagement: metrics.engagement[index]?.score || 0,
  })) || [];

  return (
    <Card data-testid="engagement-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-heading font-semibold">
              Engagement Metrics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last {timeRange} days performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={timeRange === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(7)}
              data-testid="chart-7d-button"
            >
              7D
            </Button>
            <Button
              variant={timeRange === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(30)}
              data-testid="chart-30d-button"
            >
              30D
            </Button>
            <Button
              variant={timeRange === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(90)}
              data-testid="chart-90d-button"
            >
              90D
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart Legend */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-sm text-muted-foreground">Registrations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-accent"></div>
            <span className="text-sm text-muted-foreground">Attendance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span className="text-sm text-muted-foreground">Engagement</span>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Bar dataKey="registrations" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="attendance" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="engagement" fill="hsl(var(--secondary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
