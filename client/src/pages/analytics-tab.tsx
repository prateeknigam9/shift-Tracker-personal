import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowUp, ArrowDown, TrendingUp, Clock, DollarSign, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsTab() {
  const [timeframe, setTimeframe] = useState('weekly');
  const { toast } = useToast();
  
  // Query for analytics based on selected timeframe
  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/analytics/${timeframe}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    toast({
      title: "Error loading analytics",
      description: "There was a problem loading your analytics data. Please try again later.",
      variant: "destructive",
    });
    
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <h3 className="text-xl font-semibold mb-2">Unable to load analytics</h3>
        <p className="text-muted-foreground mb-4">There was a problem loading your analytics data. Please try again later.</p>
      </div>
    );
  }
  
  // Extract chart data based on current timeframe
  const chartData = data ? 
    timeframe === 'weekly' ? data.dailyData : 
    timeframe === 'monthly' ? data.weeklyData : 
    data.monthlyData : [] as any[];
  
  // Extract summary data
  const summary = data?.summary || {
    totalHours: 0,
    totalEarnings: 0,
    averageHoursPerDay: 0,
    averageHoursPerWeek: 0,
    averageHoursPerMonth: 0,
    mostActiveDay: '',
    mostActiveWeek: '',
    mostActiveMonth: '',
  };
  
  // Extract shift types for pie chart
  const shiftTypes = data?.shiftTypes || [];
  
  // AI-generated insights
  const insights = data?.insights || "No insights available at this time.";
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-500 text-transparent bg-clip-text">
        Analytics Dashboard
      </h1>
      
      <Tabs 
        defaultValue="weekly" 
        value={timeframe}
        onValueChange={(value) => setTimeframe(value)}
        className="mb-8"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="weekly" className="text-lg py-3">
            <Calendar className="mr-2 h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-lg py-3">
            <Calendar className="mr-2 h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="yearly" className="text-lg py-3">
            <Calendar className="mr-2 h-4 w-4" />
            Yearly
          </TabsTrigger>
        </TabsList>
        
        {/* Analytics Content - Same layout for all tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Hours Summary Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                Total Hours
              </CardTitle>
              <CardDescription>
                {timeframe === 'weekly' ? 'Last 7 days' : 
                 timeframe === 'monthly' ? 'Last 30 days' : 'Last 12 months'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalHours || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Average: {
                  timeframe === 'weekly' ? `${summary.averageHoursPerDay || 0}/day` : 
                  timeframe === 'monthly' ? `${summary.averageHoursPerWeek || 0}/week` : 
                  `${summary.averageHoursPerMonth || 0}/month`
                }
              </p>
            </CardContent>
          </Card>
          
          {/* Earnings Summary Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                Total Earnings
              </CardTitle>
              <CardDescription>
                {timeframe === 'weekly' ? 'Last 7 days' : 
                 timeframe === 'monthly' ? 'Last 30 days' : 'Last 12 months'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.totalEarnings || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">
                {
                  timeframe === 'weekly' ? `Most active: ${summary.mostActiveDay || 'N/A'}` :
                  timeframe === 'monthly' ? `Most active: ${summary.mostActiveWeek || 'N/A'}` :
                  `Most active: ${summary.mostActiveMonth || 'N/A'}`
                }
              </p>
            </CardContent>
          </Card>
          
          {/* Shift Distribution Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-purple-500" />
                Shift Distribution
              </CardTitle>
              <CardDescription>By time of day</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              {shiftTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={shiftTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {shiftTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  No shift data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Hours & Earnings Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Hours & Earnings Overview</CardTitle>
            <CardDescription>
              {timeframe === 'weekly' ? 'Daily breakdown for the past week' : 
               timeframe === 'monthly' ? 'Weekly breakdown for the past month' : 
               'Monthly breakdown for the past year'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="earnings" name="Earnings ($)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for the selected timeframe
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* AI Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                AI-Powered Insights
              </span>
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                GROQ
              </Badge>
            </CardTitle>
            <CardDescription>Personalized analysis of your work patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              {insights.split('\n\n').map((paragraph: string, i: number) => (
                <React.Fragment key={i}>
                  <p>{paragraph}</p>
                  {i < insights.split('\n\n').length - 1 && <Separator className="my-2" />}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}