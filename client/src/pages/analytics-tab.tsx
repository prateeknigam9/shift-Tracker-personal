import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, BarChart, TrendingUp } from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

// Define chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function AnalyticsTab() {
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const { toast } = useToast();

  // Fetch weekly analytics data
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    error: weeklyError
  } = useQuery({
    queryKey: ["/api/analytics/weekly"],
    enabled: timeframe === "weekly",
  });

  // Fetch monthly analytics data
  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    error: monthlyError
  } = useQuery({
    queryKey: ["/api/analytics/monthly"],
    enabled: timeframe === "monthly",
  });

  // Fetch yearly analytics data
  const {
    data: yearlyData,
    isLoading: yearlyLoading,
    error: yearlyError
  } = useQuery({
    queryKey: ["/api/analytics/yearly"],
    enabled: timeframe === "yearly",
  });

  // Sample data for placeholder charts until API is ready
  const sampleWeeklyData = [
    { name: "Monday", hours: 8, earnings: 160 },
    { name: "Tuesday", hours: 7, earnings: 140 },
    { name: "Wednesday", hours: 8, earnings: 160 },
    { name: "Thursday", hours: 6, earnings: 120 },
    { name: "Friday", hours: 9, earnings: 180 },
    { name: "Saturday", hours: 4, earnings: 100 },
    { name: "Sunday", hours: 0, earnings: 0 },
  ];

  const sampleMonthlyData = [
    { name: "Week 1", hours: 38, earnings: 760 },
    { name: "Week 2", hours: 42, earnings: 840 },
    { name: "Week 3", hours: 36, earnings: 720 },
    { name: "Week 4", hours: 40, earnings: 800 },
  ];

  const sampleYearlyData = [
    { name: "Jan", hours: 160, earnings: 3200 },
    { name: "Feb", hours: 148, earnings: 2960 },
    { name: "Mar", hours: 156, earnings: 3120 },
    { name: "Apr", hours: 152, earnings: 3040 },
    { name: "May", hours: 168, earnings: 3360 },
    { name: "Jun", hours: 140, earnings: 2800 },
    { name: "Jul", hours: 164, earnings: 3280 },
    { name: "Aug", hours: 172, earnings: 3440 },
    { name: "Sep", hours: 156, earnings: 3120 },
    { name: "Oct", hours: 160, earnings: 3200 },
    { name: "Nov", hours: 152, earnings: 3040 },
    { name: "Dec", hours: 140, earnings: 2800 },
  ];

  const pieChartData = [
    { name: "Morning Shifts", value: 35 },
    { name: "Afternoon Shifts", value: 40 },
    { name: "Night Shifts", value: 25 },
  ];

  // Calculate data to display based on timeframe
  const displayData = (() => {
    if (timeframe === "weekly") {
      return weeklyData || sampleWeeklyData;
    } else if (timeframe === "monthly") {
      return monthlyData || sampleMonthlyData;
    } else {
      return yearlyData || sampleYearlyData;
    }
  })();

  const isLoading = weeklyLoading || monthlyLoading || yearlyLoading;
  const hasError = weeklyError || monthlyError || yearlyError;

  if (hasError) {
    toast({
      title: "Error loading analytics data",
      description: "Please try again later",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics & Reports</h2>
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as "weekly" | "monthly" | "yearly")}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hours and Earnings Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Hours & Earnings</CardTitle>
              <CardDescription>Hours worked and earnings by {timeframe} view</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="earnings" name="Earnings ($)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Shift Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Shift Distribution</CardTitle>
              <CardDescription>Breakdown of shift types</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trends Over Time */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Trends Over Time</CardTitle>
              <CardDescription>Hours and earnings trends</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#8884d8" name="Hours" />
                  <Line type="monotone" dataKey="earnings" stroke="#82ca9d" name="Earnings ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Summary Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Work Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="font-medium">
                    {displayData.reduce((acc, curr) => acc + curr.hours, 0)} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Hours/Day:</span>
                  <span className="font-medium">
                    {(displayData.reduce((acc, curr) => acc + curr.hours, 0) / displayData.length).toFixed(1)} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Earnings:</span>
                  <span className="font-medium text-green-600">
                    ${displayData.reduce((acc, curr) => acc + curr.earnings, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-medium">$20/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most Active Day:</span>
                  <span className="font-medium">
                    {displayData.reduce((prev, current) => 
                      (prev.hours > current.hours) ? prev : current
                    ).name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overtime Hours:</span>
                  <span className="font-medium">
                    {displayData.reduce((acc, curr) => acc + (curr.hours > 8 ? curr.hours - 8 : 0), 0)} hours
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}