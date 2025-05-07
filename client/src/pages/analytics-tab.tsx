import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowUp, ArrowDown, TrendingUp, Clock, DollarSign, Calendar, BarChart } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          View and analyze your work patterns, earnings, and performance metrics across different time periods.
        </p>
        <div className="absolute h-1 w-24 bg-gradient-to-r from-primary to-secondary bottom-0 left-0 rounded-full"></div>
      </div>
      
      <Tabs 
        defaultValue="weekly" 
        value={timeframe}
        onValueChange={(value) => setTimeframe(value)}
        className="mb-8"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 rounded-xl bg-muted/50 backdrop-blur-sm">
          <TabsTrigger value="weekly" className="text-lg py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200">
            <Calendar className="mr-2 h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-lg py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200">
            <Calendar className="mr-2 h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="yearly" className="text-lg py-3 rounded-lg data-[state=active]:shadow-md transition-all duration-200">
            <Calendar className="mr-2 h-4 w-4" />
            Yearly
          </TabsTrigger>
        </TabsList>
        
        {/* Analytics Content - Same layout for all tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Hours Summary Card */}
          <Card className="card-hover shadow-md border-t-4 border-blue-400 dark:border-blue-600">
            <CardHeader className="pb-2 card-header-gradient">
              <CardTitle className="text-xl flex items-center">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                  <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                Total Hours
              </CardTitle>
              <CardDescription>
                {timeframe === 'weekly' ? 'Last 7 days' : 
                 timeframe === 'monthly' ? 'Last 30 days' : 'Last 12 months'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold mb-3">{summary.totalHours || 0}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <ArrowUp className="h-4 w-4 mr-1 text-green-500" />
                <span>
                  Average: {
                    timeframe === 'weekly' ? `${summary.averageHoursPerDay || 0}/day` : 
                    timeframe === 'monthly' ? `${summary.averageHoursPerWeek || 0}/week` : 
                    `${summary.averageHoursPerMonth || 0}/month`
                  }
                </span>
              </div>
              {/* Progress indicator */}
              <div className="mt-4 h-2 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full progress-animate" 
                  style={{ width: summary.totalHours ? `${Math.min(100, summary.totalHours * 3)}%` : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Earnings Summary Card */}
          <Card className="card-hover shadow-md border-t-4 border-green-400 dark:border-green-600">
            <CardHeader className="pb-2 card-header-gradient">
              <CardTitle className="text-xl flex items-center">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
                  <DollarSign className="h-5 w-5 text-green-500 dark:text-green-400" />
                </div>
                Total Earnings
              </CardTitle>
              <CardDescription>
                {timeframe === 'weekly' ? 'Last 7 days' : 
                 timeframe === 'monthly' ? 'Last 30 days' : 'Last 12 months'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold mb-3">${summary.totalEarnings || 0}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/30">
                  {
                    timeframe === 'weekly' ? `Most active: ${summary.mostActiveDay || 'N/A'}` :
                    timeframe === 'monthly' ? `Most active: ${summary.mostActiveWeek || 'N/A'}` :
                    `Most active: ${summary.mostActiveMonth || 'N/A'}`
                  }
                </Badge>
              </div>
              {/* Progress indicator */}
              <div className="mt-4 h-2 w-full bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full progress-animate" 
                  style={{ width: summary.totalEarnings ? `${Math.min(100, summary.totalEarnings / 10)}%` : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Shift Distribution Card */}
          <Card className="card-hover shadow-md border-t-4 border-purple-400 dark:border-purple-600">
            <CardHeader className="pb-2 card-header-gradient">
              <CardTitle className="text-xl flex items-center">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
                  <TrendingUp className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </div>
                Shift Distribution
              </CardTitle>
              <CardDescription>By time of day</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-4">
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
                    <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  <div className="p-4 rounded-lg border border-dashed text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No shift data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Hours & Earnings Chart */}
        <Card className="mb-8 shadow-lg animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="card-header-gradient">
            <CardTitle className="text-xl flex items-center">
              <div className="mr-2 p-1.5 rounded-md bg-primary/10">
                <BarChart className="h-5 w-5 text-primary" />
              </div>
              Hours & Earnings Overview
            </CardTitle>
            <CardDescription>
              {timeframe === 'weekly' ? 'Daily breakdown for the past week' : 
               timeframe === 'monthly' ? 'Weekly breakdown for the past month' : 
               'Monthly breakdown for the past year'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '0.5rem', 
                      border: '1px solid rgba(0,0,0,0.1)', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.95)' 
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{
                      borderRadius: '0.5rem',
                      paddingTop: '8px'
                    }}
                  />
                  <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="earnings" name="Earnings ($)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="p-6 rounded-lg border border-dashed text-center max-w-sm">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-1">No Data Available</h3>
                  <p>There is no data available for the selected timeframe. Try selecting a different period.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* AI Insights Card */}
        <Card className="shadow-lg fancy-dialog animate-slide-up border border-purple-200/50 dark:border-purple-800/20" style={{ animationDelay: '200ms' }}>
          <CardHeader className="card-header-gradient">
            <CardTitle className="text-xl flex items-center">
              <span className="gradient-text font-semibold">
                AI-Powered Insights
              </span>
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none shadow-sm">
                GROQ
              </Badge>
            </CardTitle>
            <CardDescription>Personalized analysis of your work patterns</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {insights.split('\n\n').map((paragraph: string, i: number) => (
                <React.Fragment key={i}>
                  <p className="leading-relaxed">{paragraph}</p>
                  {i < insights.split('\n\n').length - 1 && 
                    <Separator className="my-3 bg-gradient-to-r from-transparent via-purple-200/50 dark:via-purple-800/20 to-transparent" />
                  }
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}