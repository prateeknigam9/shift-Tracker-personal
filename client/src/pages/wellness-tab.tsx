import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WellnessMetric, WellnessGoal } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { CalendarIcon, LineChart, Sparkles, ListTodo, ActivitySquare, ArrowUpRight, ArrowDownRight, ArrowRight, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function WellnessTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    work_hours: "0",
    overtime_hours: "0",
    stress_level: 1,
    rest_quality: 1,
    work_satisfaction: 1,
    balance_score: 50,
    notes: ""
  });
  const [newGoal, setNewGoal] = useState({
    goal_type: "max_weekly_hours",
    target_value: "40",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    is_active: 1,
    notes: ""
  });

  // Fetch wellness summary data
  const { 
    data: summary, 
    isLoading: isSummaryLoading,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ["/api/wellness/summary"],
    queryFn: ({ signal }) => fetch("/api/wellness/summary", { signal }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch wellness summary");
      return res.json();
    }),
  });

  // Fetch wellness metrics
  const { 
    data: metrics, 
    isLoading: isMetricsLoading,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ["/api/wellness/metrics"],
    queryFn: ({ signal }) => fetch("/api/wellness/metrics", { signal }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch wellness metrics");
      return res.json();
    }),
  });

  // Fetch wellness goals
  const { 
    data: goals, 
    isLoading: isGoalsLoading,
    refetch: refetchGoals
  } = useQuery({
    queryKey: ["/api/wellness/goals"],
    queryFn: ({ signal }) => fetch("/api/wellness/goals", { signal }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch wellness goals");
      return res.json();
    }),
  });

  // Add metric mutation
  const addMetricMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/wellness/metrics", {
        ...data,
        user_id: user?.id
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/summary"] });
      toast({
        title: "Wellness metric added",
        description: "Your wellness data has been saved successfully.",
      });
      setMetricDialogOpen(false);
      setNewMetric({
        date: format(new Date(), "yyyy-MM-dd"),
        work_hours: "0",
        overtime_hours: "0",
        stress_level: 1,
        rest_quality: 1,
        work_satisfaction: 1,
        balance_score: 50,
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add wellness metric",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/wellness/goals", {
        ...data,
        user_id: user?.id
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wellness/summary"] });
      toast({
        title: "Wellness goal added",
        description: "Your wellness goal has been saved successfully.",
      });
      setGoalDialogOpen(false);
      setNewGoal({
        goal_type: "max_weekly_hours",
        target_value: "40",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        is_active: 1,
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add wellness goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle metric form submission
  const handleSubmitMetric = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate balance score based on other metrics if not set manually
    let calculatedBalanceScore = newMetric.balance_score;
    
    if (calculatedBalanceScore === 50) {
      // Simple formula: score = 100 - (stress_level * 10) + (rest_quality * 10) + (work_satisfaction * 10) - overtime effect
      const overtimeEffect = parseFloat(newMetric.overtime_hours) > 0 ? 10 : 0;
      
      calculatedBalanceScore = Math.min(
        100, 
        Math.max(
          0, 
          100 - 
          (newMetric.stress_level * 10) + 
          (newMetric.rest_quality * 10) + 
          (newMetric.work_satisfaction * 10) - 
          overtimeEffect
        )
      );
    }
    
    addMetricMutation.mutate({
      ...newMetric,
      balance_score: calculatedBalanceScore
    });
  };

  // Handle goal form submission
  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    addGoalMutation.mutate(newGoal);
  };

  // Generate trend icon based on status
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case "improving":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "declining":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRight className="h-4 w-4 text-gray-500" />;
    }
  };

  // Find trend status for a specific metric
  const getTrendStatus = (metricName: string) => {
    if (!summary?.trends) return "steady";
    if (summary.trends.improving.includes(metricName)) return "improving";
    if (summary.trends.declining.includes(metricName)) return "declining";
    return "steady";
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Work-Life Balance Tracker
        </h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              refetchSummary();
              refetchMetrics();
              refetchGoals();
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-3 sm:w-[400px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {isSummaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Wellness Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      Stress Level
                      {getTrendIcon(getTrendStatus("stress_level"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.averageScores.stress_level.toFixed(1)}/5
                    </div>
                    <Progress 
                      value={summary.averageScores.stress_level * 20} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("stress_level") === "improving" ? "Decreasing" : 
                       getTrendStatus("stress_level") === "declining" ? "Increasing" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      Rest Quality
                      {getTrendIcon(getTrendStatus("rest_quality"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.averageScores.rest_quality.toFixed(1)}/5
                    </div>
                    <Progress 
                      value={summary.averageScores.rest_quality * 20} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("rest_quality") === "improving" ? "Improving" : 
                       getTrendStatus("rest_quality") === "declining" ? "Declining" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      Satisfaction
                      {getTrendIcon(getTrendStatus("work_satisfaction"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.averageScores.work_satisfaction.toFixed(1)}/5
                    </div>
                    <Progress 
                      value={summary.averageScores.work_satisfaction * 20} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("work_satisfaction") === "improving" ? "Improving" : 
                       getTrendStatus("work_satisfaction") === "declining" ? "Declining" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      Balance Score
                      {getTrendIcon(getTrendStatus("balance_score"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.averageScores.balance_score.toFixed(0)}/100
                    </div>
                    <Progress 
                      value={summary.averageScores.balance_score} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("balance_score") === "improving" ? "Improving" : 
                       getTrendStatus("balance_score") === "declining" ? "Declining" : "Stable"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Work Data and Goals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/60 backdrop-blur-sm md:col-span-1">
                  <CardHeader>
                    <CardTitle>Work Hours</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Total Work Hours</div>
                      <div className="font-bold">{summary.totalHours.toFixed(1)}h</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Overtime Hours</div>
                      <div className="font-bold">{summary.totalOvertime.toFixed(1)}h</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Daily Average</div>
                      <div className="font-bold">
                        {(summary.totalHours / Math.max(1, summary.recentEntries.length)).toFixed(1)}h
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm md:col-span-2">
                  <CardHeader>
                    <CardTitle>Goal Progress</CardTitle>
                    <CardDescription>Your active wellness goals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {summary.goalProgress && summary.goalProgress.length > 0 ? (
                      <div className="space-y-4">
                        {summary.goalProgress.map((goal: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between">
                              <div className="text-sm font-medium">
                                {goal.goal_type === "max_weekly_hours" ? "Maximum Weekly Hours" :
                                 goal.goal_type === "min_rest_days" ? "Minimum Rest Days" :
                                 goal.goal_type === "min_avg_satisfaction" ? "Minimum Satisfaction" :
                                 goal.goal_type}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {goal.progress.toFixed(0)}%
                              </div>
                            </div>
                            <Progress value={goal.progress} className="h-2 bg-slate-200 dark:bg-slate-800" />
                            <div className="text-xs text-muted-foreground">
                              Target: {goal.target_value} {goal.goal_type === "max_weekly_hours" ? "hours" : 
                                                        goal.goal_type === "min_rest_days" ? "days" : 
                                                        goal.goal_type === "min_avg_satisfaction" ? "rating" : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No active goals found</p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => setActiveTab("goals")}
                        >
                          Create your first goal
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>Personalized suggestions based on your data</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.recommendations && summary.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {summary.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      Continue tracking your metrics to receive personalized recommendations.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No wellness data yet</h3>
              <p className="text-muted-foreground mb-6">Start tracking your work-life balance by adding daily metrics</p>
              <Button onClick={() => {
                setActiveTab("metrics");
                setTimeout(() => setMetricDialogOpen(true), 100);
              }}>
                Add Your First Entry
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Wellness Metrics</h2>
              <Button onClick={() => setMetricDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {isMetricsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : metrics && metrics.length > 0 ? (
              <div className="space-y-4">
                {metrics.map((metric: WellnessMetric) => (
                  <Card key={metric.id} className="bg-card/60 backdrop-blur-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-32 bg-muted/50 flex items-center justify-center p-4">
                        <div className="text-center">
                          <CalendarIcon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <div className="font-semibold">{formatDate(metric.date as string)}</div>
                        </div>
                      </div>
                      <CardContent className="flex-1 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Work Hours</div>
                            <div className="font-bold">{parseFloat(metric.work_hours as string).toFixed(1)}h</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Overtime</div>
                            <div className="font-bold">{parseFloat(metric.overtime_hours as string).toFixed(1)}h</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Stress Level</div>
                            <div className="font-bold">{metric.stress_level}/5</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Rest Quality</div>
                            <div className="font-bold">{metric.rest_quality}/5</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Satisfaction</div>
                            <div className="font-bold">{metric.work_satisfaction}/5</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Balance Score</div>
                            <div className="flex items-center">
                              <div className="font-bold mr-2">{metric.balance_score}/100</div>
                              <Progress 
                                value={metric.balance_score} 
                                className="h-2 flex-1 bg-slate-200 dark:bg-slate-800" 
                              />
                            </div>
                          </div>
                        </div>
                        {metric.notes && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-muted-foreground">Notes</div>
                            <div className="text-sm mt-1">{metric.notes}</div>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No metrics recorded yet</h3>
                <p className="text-muted-foreground mb-6">Start tracking your daily work-life balance</p>
                <Button onClick={() => setMetricDialogOpen(true)}>Add Your First Entry</Button>
              </div>
            )}
          </div>

          {/* Add Metric Dialog */}
          <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Wellness Entry</DialogTitle>
                <DialogDescription>
                  Record your daily work-life balance metrics
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitMetric}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="date">Date</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={newMetric.date}
                        onChange={(e) => setNewMetric({...newMetric, date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="work_hours">Work Hours</Label>
                      <Input 
                        id="work_hours" 
                        type="number" 
                        step="0.5"
                        min="0" 
                        value={newMetric.work_hours}
                        onChange={(e) => setNewMetric({...newMetric, work_hours: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="overtime_hours">Overtime Hours</Label>
                      <Input 
                        id="overtime_hours" 
                        type="number" 
                        step="0.5"
                        min="0" 
                        value={newMetric.overtime_hours}
                        onChange={(e) => setNewMetric({...newMetric, overtime_hours: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="stress_level">
                      Stress Level: {newMetric.stress_level}/5
                    </Label>
                    <Slider 
                      id="stress_level"
                      min={1} 
                      max={5} 
                      step={1}
                      value={[newMetric.stress_level]} 
                      onValueChange={(value) => setNewMetric({...newMetric, stress_level: value[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="rest_quality">
                      Rest Quality: {newMetric.rest_quality}/5
                    </Label>
                    <Slider 
                      id="rest_quality"
                      min={1} 
                      max={5} 
                      step={1}
                      value={[newMetric.rest_quality]} 
                      onValueChange={(value) => setNewMetric({...newMetric, rest_quality: value[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Average</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="work_satisfaction">
                      Work Satisfaction: {newMetric.work_satisfaction}/5
                    </Label>
                    <Slider 
                      id="work_satisfaction"
                      min={1} 
                      max={5} 
                      step={1}
                      value={[newMetric.work_satisfaction]} 
                      onValueChange={(value) => setNewMetric({...newMetric, work_satisfaction: value[0]})}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Unsatisfied</span>
                      <span>Neutral</span>
                      <span>Very Satisfied</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input 
                      id="notes" 
                      value={newMetric.notes}
                      onChange={(e) => setNewMetric({...newMetric, notes: e.target.value})}
                      placeholder="Any additional notes about your day"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setMetricDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMetricMutation.isPending}>
                    {addMetricMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Wellness Goals</h2>
              <Button onClick={() => setGoalDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>

            {isGoalsLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal: WellnessGoal) => (
                  <Card key={goal.id} className="bg-card/60 backdrop-blur-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-32 bg-muted/50 flex items-center justify-center p-4">
                        <Badge variant={goal.is_active ? "default" : "secondary"}>
                          {goal.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardContent className="flex-1 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">
                            {goal.goal_type === "max_weekly_hours" ? "Maximum Weekly Hours" :
                             goal.goal_type === "min_rest_days" ? "Minimum Rest Days" :
                             goal.goal_type === "min_avg_satisfaction" ? "Minimum Satisfaction" :
                             goal.goal_type}
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            Target: <span className="font-medium">{goal.target_value}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                            <div className="text-sm">{formatDate(goal.start_date as string)}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">End Date</div>
                            <div className="text-sm">
                              {goal.end_date ? formatDate(goal.end_date as string) : "No end date"}
                            </div>
                          </div>
                        </div>
                        {goal.notes && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-muted-foreground">Notes</div>
                            <div className="text-sm mt-1">{goal.notes}</div>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No wellness goals set</h3>
                <p className="text-muted-foreground mb-6">Create goals to improve your work-life balance</p>
                <Button onClick={() => setGoalDialogOpen(true)}>Set Your First Goal</Button>
              </div>
            )}
          </div>

          {/* Add Goal Dialog */}
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Wellness Goal</DialogTitle>
                <DialogDescription>
                  Set targets to improve your work-life balance
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitGoal}>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="goal_type">Goal Type</Label>
                    <select
                      id="goal_type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newGoal.goal_type}
                      onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
                      required
                    >
                      <option value="max_weekly_hours">Maximum Weekly Work Hours</option>
                      <option value="min_rest_days">Minimum Rest Days Per Week</option>
                      <option value="min_avg_satisfaction">Minimum Work Satisfaction</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input 
                      id="target_value" 
                      type="number" 
                      step={newGoal.goal_type === "min_avg_satisfaction" ? "0.5" : "1"}
                      min="0" 
                      max={newGoal.goal_type === "min_avg_satisfaction" ? "5" : 
                           newGoal.goal_type === "min_rest_days" ? "7" : "168"}
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                      required
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {newGoal.goal_type === "max_weekly_hours" ? "Hours per week" : 
                       newGoal.goal_type === "min_rest_days" ? "Days per week" : 
                       "Rating (1-5)"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input 
                        id="start_date" 
                        type="date" 
                        value={newGoal.start_date}
                        onChange={(e) => setNewGoal({...newGoal, start_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input 
                        id="end_date" 
                        type="date" 
                        value={newGoal.end_date}
                        onChange={(e) => setNewGoal({...newGoal, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={newGoal.is_active === 1}
                      onChange={(e) => setNewGoal({...newGoal, is_active: e.target.checked ? 1 : 0})}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Active Goal
                    </Label>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input 
                      id="notes" 
                      value={newGoal.notes}
                      onChange={(e) => setNewGoal({...newGoal, notes: e.target.value})}
                      placeholder="Add any additional notes about this goal"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setGoalDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addGoalMutation.isPending}>
                    {addGoalMutation.isPending ? "Saving..." : "Save Goal"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}