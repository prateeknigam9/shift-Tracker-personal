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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { SalesKpi, Shift } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { 
  BarChart, 
  LineChart, 
  ShoppingBag, 
  PlusCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  ShoppingCart,
  Smartphone,
  Shield,
  Tv,
  Wifi,
  MonitorPlay
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function KpiTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [newKpi, setNewKpi] = useState({
    shift_id: 0,
    tech_insurance_sales: 0,
    instant_insurance_sales: 0,
    sky_tv_sales: 0,
    sky_broadband_sales: 0,
    sky_streaming_sales: 0,
    notes: ""
  });

  // Fetch KPI summary data
  const { 
    data: summary, 
    isLoading: isSummaryLoading,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ["/api/kpi/summary"],
    queryFn: ({ signal }) => fetch("/api/kpi/summary", { signal }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch KPI summary");
      return res.json();
    }),
  });

  // Fetch KPIs
  const { 
    data: kpis, 
    isLoading: isKpisLoading,
    refetch: refetchKpis
  } = useQuery({
    queryKey: ["/api/kpi"],
    queryFn: ({ signal }) => fetch("/api/kpi", { signal }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      return res.json();
    }),
  });

  // Fetch shifts for KPI association
  const { 
    data: shifts, 
    isLoading: isShiftsLoading 
  } = useQuery({
    queryKey: ["/api/shifts"],
    queryFn: ({ signal }) => fetch("/api/shifts", { signal }).then(res => {
      if (!res.ok) throw new Error("Failed to fetch shifts");
      return res.json();
    }),
  });

  // Add KPI mutation
  const addKpiMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/kpi", {
        ...data,
        user_id: user?.id
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpi"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kpi/summary"] });
      toast({
        title: "KPI data added",
        description: "Your sales KPI data has been saved successfully.",
      });
      setKpiDialogOpen(false);
      resetKpiForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add KPI data",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Check if KPI exists for a shift
  const checkShiftKpi = useMutation({
    mutationFn: async (shiftId: number) => {
      const res = await fetch(`/api/kpi/shift/${shiftId}`);
      if (!res.ok) throw new Error("Failed to check shift KPI");
      return res.json();
    },
    onSuccess: (data) => {
      if (data && data.id) {
        // KPI exists for this shift
        toast({
          title: "KPI already exists",
          description: "This shift already has KPI data. Please edit the existing record.",
        });
      } else {
        // No KPI for this shift, open the dialog
        setKpiDialogOpen(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
  });

  // Reset KPI form
  const resetKpiForm = () => {
    setNewKpi({
      shift_id: 0,
      tech_insurance_sales: 0,
      instant_insurance_sales: 0,
      sky_tv_sales: 0,
      sky_broadband_sales: 0,
      sky_streaming_sales: 0,
      notes: ""
    });
    setSelectedShift(null);
  };

  // Handle shift selection for KPI
  const handleShiftSelect = (shift: Shift) => {
    setSelectedShift(shift);
    setNewKpi(prev => ({
      ...prev,
      shift_id: shift.id
    }));
    checkShiftKpi.mutate(shift.id);
  };

  // Handle KPI form submission
  const handleSubmitKpi = (e: React.FormEvent) => {
    e.preventDefault();
    addKpiMutation.mutate(newKpi);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Find trend status for a specific metric
  const getTrendStatus = (metricName: string) => {
    if (!summary?.trends) return "steady";
    if (summary.trends.increasing.includes(metricName)) return "increasing";
    if (summary.trends.decreasing.includes(metricName)) return "decreasing";
    return "steady";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
          Sales Performance Tracker
        </h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              refetchSummary();
              refetchKpis();
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
        <TabsList className="mb-6 grid grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kpis">KPI Records</TabsTrigger>
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
              {/* Total Sales Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-card/60 backdrop-blur-sm border-t-4 border-t-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Tech Insurance
                      </div>
                      {getTrendIcon(getTrendStatus("tech_insurance_sales"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.totals.tech_insurance_sales}
                    </div>
                    <Progress 
                      value={summary.totals.tech_insurance_sales / Math.max(1, summary.totalSales) * 100} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("tech_insurance_sales") === "increasing" ? "Trending Up" : 
                       getTrendStatus("tech_insurance_sales") === "decreasing" ? "Trending Down" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm border-t-4 border-t-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Instant Insurance
                      </div>
                      {getTrendIcon(getTrendStatus("instant_insurance_sales"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.totals.instant_insurance_sales}
                    </div>
                    <Progress 
                      value={summary.totals.instant_insurance_sales / Math.max(1, summary.totalSales) * 100} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("instant_insurance_sales") === "increasing" ? "Trending Up" : 
                       getTrendStatus("instant_insurance_sales") === "decreasing" ? "Trending Down" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm border-t-4 border-t-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tv className="h-4 w-4" />
                        Sky TV
                      </div>
                      {getTrendIcon(getTrendStatus("sky_tv_sales"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.totals.sky_tv_sales}
                    </div>
                    <Progress 
                      value={summary.totals.sky_tv_sales / Math.max(1, summary.totalSales) * 100} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("sky_tv_sales") === "increasing" ? "Trending Up" : 
                       getTrendStatus("sky_tv_sales") === "decreasing" ? "Trending Down" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm border-t-4 border-t-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Sky Broadband
                      </div>
                      {getTrendIcon(getTrendStatus("sky_broadband_sales"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.totals.sky_broadband_sales}
                    </div>
                    <Progress 
                      value={summary.totals.sky_broadband_sales / Math.max(1, summary.totalSales) * 100} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("sky_broadband_sales") === "increasing" ? "Trending Up" : 
                       getTrendStatus("sky_broadband_sales") === "decreasing" ? "Trending Down" : "Stable"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur-sm border-t-4 border-t-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MonitorPlay className="h-4 w-4" />
                        Sky Streaming
                      </div>
                      {getTrendIcon(getTrendStatus("sky_streaming_sales"))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">
                      {summary.totals.sky_streaming_sales}
                    </div>
                    <Progress 
                      value={summary.totals.sky_streaming_sales / Math.max(1, summary.totalSales) * 100} 
                      className="h-2 mt-2 bg-slate-200 dark:bg-slate-800" 
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTrendStatus("sky_streaming_sales") === "increasing" ? "Trending Up" : 
                       getTrendStatus("sky_streaming_sales") === "decreasing" ? "Trending Down" : "Stable"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Performance Overview */}
              <Card className="bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                  <CardDescription>Last 6 months sales breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-6">
                      {summary.monthlyBreakdown.map((month: any, index: number) => (
                        <div key={index} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">
                              {month.month} {month.year}
                            </h3>
                            <Badge variant={month.total > 0 ? "default" : "outline"}>
                              {month.total} Sales
                            </Badge>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="space-y-1">
                              <div className="text-xs font-medium flex items-center gap-1">
                                <Smartphone className="h-3 w-3" /> Tech
                              </div>
                              <Progress value={month.tech_insurance_sales / Math.max(1, month.total) * 100} 
                                className="h-1.5 bg-slate-200 dark:bg-slate-800" />
                              <div className="text-xs text-right">{month.tech_insurance_sales}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Insurance
                              </div>
                              <Progress value={month.instant_insurance_sales / Math.max(1, month.total) * 100} 
                                className="h-1.5 bg-slate-200 dark:bg-slate-800" />
                              <div className="text-xs text-right">{month.instant_insurance_sales}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium flex items-center gap-1">
                                <Tv className="h-3 w-3" /> TV
                              </div>
                              <Progress value={month.sky_tv_sales / Math.max(1, month.total) * 100} 
                                className="h-1.5 bg-slate-200 dark:bg-slate-800" />
                              <div className="text-xs text-right">{month.sky_tv_sales}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium flex items-center gap-1">
                                <Wifi className="h-3 w-3" /> Broadband
                              </div>
                              <Progress value={month.sky_broadband_sales / Math.max(1, month.total) * 100} 
                                className="h-1.5 bg-slate-200 dark:bg-slate-800" />
                              <div className="text-xs text-right">{month.sky_broadband_sales}</div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium flex items-center gap-1">
                                <MonitorPlay className="h-3 w-3" /> Streaming
                              </div>
                              <Progress value={month.sky_streaming_sales / Math.max(1, month.total) * 100} 
                                className="h-1.5 bg-slate-200 dark:bg-slate-800" />
                              <div className="text-xs text-right">{month.sky_streaming_sales}</div>
                            </div>
                          </div>
                          {index < summary.monthlyBreakdown.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent KPIs */}
              <Card className="bg-card/60 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Recent KPI Records</CardTitle>
                    <CardDescription>Latest sales performance data</CardDescription>
                  </div>
                  <Button 
                    onClick={() => { 
                      resetKpiForm();
                      if (shifts && shifts.length > 0) {
                        setKpiDialogOpen(true);
                      } else {
                        toast({
                          title: "No shifts available",
                          description: "Please create a shift first before adding KPI data.",
                          variant: "destructive",
                        });
                      }
                    }} 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add KPI
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {summary.recentKpis && summary.recentKpis.length > 0 ? (
                      <div className="space-y-4">
                        {summary.recentKpis.map((kpi: SalesKpi) => {
                          const totalSales = 
                            kpi.tech_insurance_sales + 
                            kpi.instant_insurance_sales + 
                            kpi.sky_tv_sales + 
                            kpi.sky_broadband_sales + 
                            kpi.sky_streaming_sales;
                          
                          const associatedShift = shifts?.find((shift: Shift) => shift.id === kpi.shift_id);
                          
                          return (
                            <Card key={kpi.id} className="bg-muted/40 backdrop-blur-sm">
                              <CardHeader className="p-3 pb-0">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="text-sm font-medium">
                                      {associatedShift ? 
                                        `Shift: ${format(new Date(associatedShift.date), "MMM dd, yyyy")}` : 
                                        `KPI ID: ${kpi.id}`}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {kpi.created_at ? format(new Date(kpi.created_at.toString()), "MMM dd, yyyy") : ""}
                                    </p>
                                  </div>
                                  <Badge>{totalSales} Total Sales</Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 pt-1">
                                <div className="grid grid-cols-5 gap-2 text-xs">
                                  <div className="flex flex-col items-center">
                                    <Smartphone className="h-4 w-4 mb-1" />
                                    <span>{kpi.tech_insurance_sales}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <Shield className="h-4 w-4 mb-1" />
                                    <span>{kpi.instant_insurance_sales}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <Tv className="h-4 w-4 mb-1" />
                                    <span>{kpi.sky_tv_sales}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <Wifi className="h-4 w-4 mb-1" />
                                    <span>{kpi.sky_broadband_sales}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <MonitorPlay className="h-4 w-4 mb-1" />
                                    <span>{kpi.sky_streaming_sales}</span>
                                  </div>
                                </div>
                                {kpi.notes && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    {kpi.notes}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
                        <h3 className="text-lg font-medium">No KPI records yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start tracking your sales performance by adding KPI data.
                        </p>
                        <Button
                          onClick={() => {
                            resetKpiForm();
                            if (shifts && shifts.length > 0) {
                              setKpiDialogOpen(true);
                            } else {
                              toast({
                                title: "No shifts available",
                                description: "Please create a shift first before adding KPI data.",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Your First KPI
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-medium">No KPI data available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your sales performance to see statistics here.
              </p>
              <Button
                onClick={() => {
                  resetKpiForm();
                  if (shifts && shifts.length > 0) {
                    setKpiDialogOpen(true);
                  } else {
                    toast({
                      title: "No shifts available",
                      description: "Please create a shift first before adding KPI data.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First KPI
              </Button>
            </div>
          )}
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">KPI Records</h2>
            <Button 
              onClick={() => {
                resetKpiForm();
                if (shifts && shifts.length > 0) {
                  setKpiDialogOpen(true);
                } else {
                  toast({
                    title: "No shifts available",
                    description: "Please create a shift first before adding KPI data.",
                    variant: "destructive",
                  });
                }
              }} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add KPI
            </Button>
          </div>

          {isKpisLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : kpis && kpis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map((kpi: SalesKpi) => {
                const totalSales = 
                  kpi.tech_insurance_sales + 
                  kpi.instant_insurance_sales + 
                  kpi.sky_tv_sales + 
                  kpi.sky_broadband_sales + 
                  kpi.sky_streaming_sales;
                
                const associatedShift = shifts?.find((shift: Shift) => shift.id === kpi.shift_id);
                
                return (
                  <Card key={kpi.id} className="overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="bg-gradient-to-r from-blue-600 to-teal-600 h-2"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-md">
                          {associatedShift ? 
                            `Shift: ${format(new Date(associatedShift.date), "MMM dd, yyyy")}` : 
                            `KPI ID: ${kpi.id}`}
                        </CardTitle>
                        <Badge variant={totalSales > 0 ? "default" : "outline"} className="ml-2">
                          {totalSales} Sales
                        </Badge>
                      </div>
                      <CardDescription>
                        {kpi.created_at ? `Added on ${format(new Date(kpi.created_at.toString()), "MMM dd, yyyy")}` : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        <div className="flex flex-col items-center">
                          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1.5 mb-1">
                            <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-semibold">{kpi.tech_insurance_sales}</span>
                          <span className="text-xs text-muted-foreground">Tech</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1.5 mb-1">
                            <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm font-semibold">{kpi.instant_insurance_sales}</span>
                          <span className="text-xs text-muted-foreground">Insurance</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-1.5 mb-1">
                            <Tv className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm font-semibold">{kpi.sky_tv_sales}</span>
                          <span className="text-xs text-muted-foreground">TV</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-1.5 mb-1">
                            <Wifi className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="text-sm font-semibold">{kpi.sky_broadband_sales}</span>
                          <span className="text-xs text-muted-foreground">Broadband</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-1.5 mb-1">
                            <MonitorPlay className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="text-sm font-semibold">{kpi.sky_streaming_sales}</span>
                          <span className="text-xs text-muted-foreground">Streaming</span>
                        </div>
                      </div>
                      
                      {kpi.notes && (
                        <div className="mt-2 text-sm border-t pt-2 border-dashed border-slate-200 dark:border-slate-800">
                          <p className="text-muted-foreground text-xs">{kpi.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-medium">No KPI records found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start tracking your sales performance to see your records here.
              </p>
              <Button
                onClick={() => {
                  resetKpiForm();
                  if (shifts && shifts.length > 0) {
                    setKpiDialogOpen(true);
                  } else {
                    toast({
                      title: "No shifts available",
                      description: "Please create a shift first before adding KPI data.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Your First KPI
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add KPI Dialog */}
      <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Sales KPI Data</DialogTitle>
            <DialogDescription>
              Record your sales performance for a specific shift.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitKpi}>
            <div className="grid gap-4 py-4">
              {/* Shift Selector */}
              {!selectedShift && (
                <div className="grid gap-2">
                  <Label htmlFor="shift" className="text-right">
                    Select Shift
                  </Label>
                  <div className="h-[200px] overflow-y-auto border rounded-md p-2">
                    {isShiftsLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <p>Loading shifts...</p>
                      </div>
                    ) : shifts && shifts.length > 0 ? (
                      shifts.map((shift: Shift) => (
                        <div 
                          key={shift.id} 
                          className="p-2 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                          onClick={() => handleShiftSelect(shift)}
                        >
                          <div className="font-medium">{format(new Date(shift.date), "MMM dd, yyyy")}</div>
                          <div className="text-sm text-muted-foreground">
                            {shift.start_time} - {shift.end_time}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p>No shifts available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selected Shift */}
              {selectedShift && (
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Date:</p>
                    <p className="text-sm">{format(new Date(selectedShift.date), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Time:</p>
                    <p className="text-sm">{selectedShift.start_time} - {selectedShift.end_time}</p>
                  </div>
                  <div className="col-span-2 mt-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={resetKpiForm}
                      className="text-xs h-7 px-2"
                    >
                      Change Shift
                    </Button>
                  </div>
                </div>
              )}

              {/* KPI Data */}
              {selectedShift && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tech_insurance_sales">Tech Insurance Sales</Label>
                      <Input
                        id="tech_insurance_sales"
                        type="number"
                        min="0"
                        value={newKpi.tech_insurance_sales}
                        onChange={(e) => setNewKpi({ ...newKpi, tech_insurance_sales: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instant_insurance_sales">Instant Insurance Sales</Label>
                      <Input
                        id="instant_insurance_sales"
                        type="number"
                        min="0"
                        value={newKpi.instant_insurance_sales}
                        onChange={(e) => setNewKpi({ ...newKpi, instant_insurance_sales: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sky_tv_sales">Sky TV Sales</Label>
                      <Input
                        id="sky_tv_sales"
                        type="number"
                        min="0"
                        value={newKpi.sky_tv_sales}
                        onChange={(e) => setNewKpi({ ...newKpi, sky_tv_sales: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sky_broadband_sales">Sky Broadband Sales</Label>
                      <Input
                        id="sky_broadband_sales"
                        type="number"
                        min="0"
                        value={newKpi.sky_broadband_sales}
                        onChange={(e) => setNewKpi({ ...newKpi, sky_broadband_sales: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sky_streaming_sales">Sky Streaming Sales</Label>
                      <Input
                        id="sky_streaming_sales"
                        type="number"
                        min="0"
                        value={newKpi.sky_streaming_sales}
                        onChange={(e) => setNewKpi({ ...newKpi, sky_streaming_sales: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes about these sales..."
                      value={newKpi.notes || ""}
                      onChange={(e) => setNewKpi({ ...newKpi, notes: e.target.value })}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setKpiDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedShift || addKpiMutation.isPending}
                className="ml-2"
              >
                {addKpiMutation.isPending ? "Saving..." : "Save KPI Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}