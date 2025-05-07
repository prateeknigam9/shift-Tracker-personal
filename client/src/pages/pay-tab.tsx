import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format, parseISO, addYears, subYears } from "date-fns";
import { 
  Loader2, Plus, Calendar, Edit, Trash, ChevronLeft, ChevronRight,
  History, CheckCircle, AlertCircle, Clock, CalendarDays, StickyNote, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PaySchedule } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PayTab() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [showPayScheduleDialog, setShowPayScheduleDialog] = useState(false);
  const [payScheduleFormData, setPayScheduleFormData] = useState({
    pay_date: '',
    period_start: '',
    period_end: '',
    amount: '',
    status: 'pending',
    notes: ''
  });
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  
  // Fetch yearly pay summary
  const {
    data: yearlyData,
    isLoading: isLoadingYearly,
    error: yearlyError,
  } = useQuery({
    queryKey: ["/api/pay/yearly", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/pay/yearly?year=${selectedYear}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch yearly pay summary");
      return res.json();
    },
  });
  
  // Fetch pay schedules
  const {
    data: paySchedules,
    isLoading: isLoadingSchedules,
    error: paySchedulesError,
  } = useQuery({
    queryKey: ["/api/pay-schedules"],
    queryFn: async () => {
      const res = await fetch("/api/pay-schedules", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch pay schedules");
      return res.json() as Promise<PaySchedule[]>;
    },
  });
  
  // Create pay schedule mutation
  const createPayScheduleMutation = useMutation({
    mutationFn: async (data: typeof payScheduleFormData) => {
      const res = await apiRequest("POST", "/api/pay-schedules", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pay-schedules"] });
      setShowPayScheduleDialog(false);
      resetPayScheduleForm();
      toast({
        title: "Success",
        description: "Pay schedule created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pay schedule",
        variant: "destructive",
      });
    },
  });

  // Update pay schedule mutation
  const updatePayScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof payScheduleFormData }) => {
      const res = await apiRequest("PATCH", `/api/pay-schedules/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pay-schedules"] });
      setShowPayScheduleDialog(false);
      resetPayScheduleForm();
      toast({
        title: "Success",
        description: "Pay schedule updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pay schedule",
        variant: "destructive",
      });
    },
  });

  // Delete pay schedule mutation
  const deletePayScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pay-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pay-schedules"] });
      toast({
        title: "Success",
        description: "Pay schedule deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pay schedule",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmitPaySchedule = () => {
    if (editingScheduleId) {
      updatePayScheduleMutation.mutate({
        id: editingScheduleId,
        data: payScheduleFormData,
      });
    } else {
      createPayScheduleMutation.mutate(payScheduleFormData);
    }
  };

  // Reset form
  const resetPayScheduleForm = () => {
    setPayScheduleFormData({
      pay_date: '',
      period_start: '',
      period_end: '',
      amount: '',
      status: 'pending',
      notes: ''
    });
    setEditingScheduleId(null);
  };

  // Open pay schedule dialog for editing
  const handleEditPaySchedule = (schedule: PaySchedule) => {
    setPayScheduleFormData({
      pay_date: schedule.pay_date as string,
      period_start: schedule.period_start as string,
      period_end: schedule.period_end as string,
      amount: String(schedule.amount),
      status: schedule.status,
      notes: schedule.notes || ''
    });
    setEditingScheduleId(schedule.id);
    setShowPayScheduleDialog(true);
  };

  // Open pay schedule dialog for creating
  const handleAddPaySchedule = () => {
    resetPayScheduleForm();
    setShowPayScheduleDialog(true);
  };
  
  if (isLoadingYearly || isLoadingSchedules) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (yearlyError || paySchedulesError) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Failed to load pay data. Please try again.</p>
      </div>
    );
  }
  
  // Get selected month data
  const selectedMonthData = yearlyData?.months?.find((m: any) => m.month === selectedMonth);
  
  // Get previous month data
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevMonthData = yearlyData?.months?.find((m: any) => m.month === prevMonth);
  
  // Helper function to change month
  const handleChangeMonth = (newMonth: number) => {
    if (newMonth < 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else if (newMonth > 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(newMonth);
    }
  };
  
  // Helper function to change year
  const handleChangeYear = (newYear: number) => {
    setSelectedYear(newYear);
  };
  
  // Calculate month-over-month change
  let percentChange = 0;
  if (prevMonthData?.total && selectedMonthData?.total) {
    percentChange = ((selectedMonthData.total - prevMonthData.total) / prevMonthData.total) * 100;
  }
  
  // Get pay periods
  const payPeriods = [
    { 
      period: "May 1-15, 2023", 
      total: 624, 
      hours: 39, 
      hourlyAvg: 16 
    },
    { 
      period: "April 16-30, 2023", 
      total: 576, 
      hours: 36, 
      hourlyAvg: 16 
    },
    { 
      period: "April 1-15, 2023", 
      total: 592, 
      hours: 37, 
      hourlyAvg: 16 
    }
  ];
  
  return (
    <section className="space-y-6">
      {/* Pay Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="card-hover overflow-hidden border-t-4 border-t-primary animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-medium">
                  Monthly Pay
                </h3>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => handleChangeMonth(selectedMonth - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] rounded-lg">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full" 
                  onClick={() => handleChangeMonth(selectedMonth + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-baseline mt-4">
              <span className="text-4xl font-bold gradient-text">
                €{selectedMonthData ? selectedMonthData.total.toFixed(2) : "0.00"}
              </span>
              {percentChange !== 0 && (
                <span className={`text-sm ml-3 py-1 px-2 rounded-full ${percentChange > 0 ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'}`}>
                  {percentChange > 0 ? "↑" : "↓"}{Math.abs(percentChange).toFixed(1)}%
                </span>
              )}
            </div>
            
            <div className="mt-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Monthly Target</span>
                <span className="font-medium">€1,500.00</span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                <div
                  className="h-full rounded-full progress-animate"
                  style={{ width: `${Math.min((selectedMonthData?.total || 0) / 1500 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover overflow-hidden border-t-4 border-t-secondary animate-fade-in">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-secondary/10">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="text-base font-medium">Pay Schedule</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 rounded-lg btn-shine"
                onClick={handleAddPaySchedule}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>
            
            {paySchedules && paySchedules.length > 0 ? (
              <div className="space-y-4">
                {/* Display last paid schedule */}
                {paySchedules
                  .filter(s => s.status === 'paid')
                  .sort((a, b) => new Date(b.pay_date as string).getTime() - new Date(a.pay_date as string).getTime())
                  .slice(0, 1)
                  .map(schedule => (
                    <div key={schedule.id} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg animate-slide-up">
                      <div>
                        <div className="font-medium flex items-center space-x-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          <span>Last Received</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(schedule.pay_date as string).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-lg font-bold font-mono text-secondary">€{Number(schedule.amount).toFixed(2)}</div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="rounded-full"
                          onClick={() => handleEditPaySchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {/* Display next upcoming schedule */}
                {paySchedules
                  .filter(s => s.status === 'pending')
                  .sort((a, b) => new Date(a.pay_date as string).getTime() - new Date(b.pay_date as string).getTime())
                  .slice(0, 1)
                  .map(schedule => (
                    <div key={schedule.id} className="flex justify-between items-center bg-accent/5 p-3 rounded-lg animate-slide-up">
                      <div>
                        <div className="font-medium flex items-center text-accent">
                          <span className="inline-block w-2 h-2 rounded-full bg-accent mr-1"></span>
                          <span>Next Payment</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(schedule.pay_date as string).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-lg font-bold font-mono">
                          €{Number(schedule.amount).toFixed(2)} 
                          <span className="text-xs text-muted-foreground">(est.)</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="rounded-full"
                          onClick={() => handleEditPaySchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center h-32 bg-muted/20 rounded-lg">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No pay schedules found</p>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mt-3 rounded-full"
                  onClick={handleAddPaySchedule}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Pay Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Pay History */}
      <Card className="card-hover animate-fade-in overflow-hidden border">
        <div className="pb-2 pt-6 px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-medium">Pay History</h2>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 rounded-lg"
              onClick={handleAddPaySchedule}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Payment</span>
            </Button>
          </div>
        </div>
        <CardContent className="pt-2 px-6 pb-6">
          {paySchedules && paySchedules.length > 0 ? (
            <div className="space-y-5">
              {paySchedules
                .sort((a, b) => new Date(b.pay_date as string).getTime() - new Date(a.pay_date as string).getTime())
                .map((schedule, index) => {
                  // Calculate hours for this pay period
                  const startDate = new Date(schedule.period_start as string);
                  const endDate = new Date(schedule.period_end as string);
                  const payDate = new Date(schedule.pay_date as string);
                  
                  const hours = Math.round(Number(schedule.amount) / 16); // Estimate hours based on average $16/hour
                  
                  // Status styles
                  const getStatusStyles = (status: string) => {
                    switch(status) {
                      case 'paid':
                        return 'bg-green-100/80 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30 shadow-sm shadow-green-100/40 dark:shadow-green-900/20';
                      case 'delayed':
                        return 'bg-red-100/80 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30 shadow-sm shadow-red-100/40 dark:shadow-red-900/20';
                      default:
                        return 'bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/30 shadow-sm shadow-amber-100/40 dark:shadow-amber-900/20';
                    }
                  };
                  
                  // Indicator icon
                  const getStatusIcon = (status: string) => {
                    switch(status) {
                      case 'paid':
                        return <CheckCircle className="h-4 w-4 mr-1.5" />;
                      case 'delayed':
                        return <AlertCircle className="h-4 w-4 mr-1.5" />;
                      default:
                        return <Clock className="h-4 w-4 mr-1.5" />;
                    }
                  };
                  
                  return (
                    <div 
                      key={schedule.id} 
                      className={`border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                        index === 0 ? 'animate-slide-up' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                          <h3 className="font-medium">
                            <span className="font-mono">{startDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span> - <span className="font-mono">{endDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                          </h3>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-xs px-2 py-1 rounded-full border flex items-center ${getStatusStyles(schedule.status)}`}>
                            {getStatusIcon(schedule.status)}
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <CalendarDays className="h-4 w-4 mr-1.5" />
                            <span>Payment on {payDate.toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span>~{hours} hours worked</span>
                          </div>
                          {schedule.notes && (
                            <div className="flex items-start mt-2 text-sm text-muted-foreground">
                              <StickyNote className="h-4 w-4 mr-1.5 mt-0.5" />
                              <span>{schedule.notes}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <div className="text-xl font-bold font-mono mb-2">
                            ${Number(schedule.amount).toFixed(2)}
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => handleEditPaySchedule(schedule)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive-foreground hover:bg-destructive"
                              onClick={() => deletePayScheduleMutation.mutate(schedule.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center h-40 bg-muted/20 mt-2 rounded-xl border border-dashed">
              <div className="bg-muted/30 p-3 rounded-full mb-3">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-3">No payment history found</p>
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-full"
                onClick={handleAddPaySchedule}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Yearly Pay Calendar */}
      <Card className="card-hover animate-fade-in overflow-hidden border-t-4 border-t-accent">
        <div className="pb-2 pt-6 px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-accent/10">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-xl font-medium">Annual Pay Overview</h2>
            </div>
            <div className="flex items-center space-x-2 bg-muted/20 p-1 rounded-full pr-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-accent/10"
                onClick={() => handleChangeYear(selectedYear - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-bold text-lg gradient-text">{selectedYear}</div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-accent/10"
                onClick={() => handleChangeYear(selectedYear + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {yearlyData?.months?.map((month: any, index: number) => {
              const monthNames = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"
              ];
              const isCurrentMonth = month.month === selectedMonth;
              const isPastMonth = month.total > 0;
              
              // Calculate animation delay for staggered appearance
              const animationDelay = `${index * 0.05}s`;
              
              return (
                <div 
                  key={month.month} 
                  className={`calendar-month border p-4 ${
                    isCurrentMonth ? 'calendar-month-active shadow-md' : 
                    isPastMonth ? 'hover:border-primary/50' : 'bg-muted/10 hover:bg-muted/20'
                  }`}
                  onClick={() => setSelectedMonth(month.month)}
                  style={{ animationDelay, animationFillMode: 'both' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className={`font-medium text-base ${isCurrentMonth ? 'text-primary' : ''}`}>
                      {monthNames[month.month - 1]}
                    </div>
                    {isPastMonth && (
                      <div className="p-1 bg-green-100/80 dark:bg-green-900/30 rounded-full shadow-sm">
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className={`font-mono text-xl font-bold ${isCurrentMonth ? 'text-primary' : ''}`}>
                    ${month.total.toFixed(2)}
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {month.hours.toFixed(1)} hrs
                    </div>
                    
                    {month.total > 0 && (
                      <div className="text-xs px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary flex items-center shadow-sm">
                        <DollarSign className="h-3 w-3 mr-0.5" />
                        ${(month.total / month.hours).toFixed(2)}/hr
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pay Schedule Dialog */}
      <Dialog open={showPayScheduleDialog} onOpenChange={setShowPayScheduleDialog}>
        <DialogContent className="fancy-dialog">
          <DialogHeader className="card-header-gradient">
            <DialogTitle className="text-lg">{editingScheduleId ? 'Edit' : 'Add'} Pay Schedule</DialogTitle>
            <DialogDescription>
              {editingScheduleId ? 'Update the' : 'Add a new'} pay schedule with payment details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay_date">Pay Date</Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={payScheduleFormData.pay_date}
                  onChange={(e) => setPayScheduleFormData({...payScheduleFormData, pay_date: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={payScheduleFormData.amount}
                  onChange={(e) => setPayScheduleFormData({...payScheduleFormData, amount: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Period Start</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={payScheduleFormData.period_start}
                  onChange={(e) => setPayScheduleFormData({...payScheduleFormData, period_start: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="period_end">Period End</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={payScheduleFormData.period_end}
                  onChange={(e) => setPayScheduleFormData({...payScheduleFormData, period_end: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={payScheduleFormData.status} 
                onValueChange={(value) => setPayScheduleFormData({...payScheduleFormData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={payScheduleFormData.notes || ''}
                onChange={(e) => setPayScheduleFormData({...payScheduleFormData, notes: e.target.value})}
                placeholder="Optional notes"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPayScheduleDialog(false);
                resetPayScheduleForm();
              }}
              className="rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleSubmitPaySchedule} 
              disabled={
                createPayScheduleMutation.isPending || 
                updatePayScheduleMutation.isPending ||
                !payScheduleFormData.pay_date ||
                !payScheduleFormData.period_start ||
                !payScheduleFormData.period_end ||
                !payScheduleFormData.amount
              }
              className="rounded-lg btn-shine"
            >
              {(createPayScheduleMutation.isPending || updatePayScheduleMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingScheduleId ? 'Update' : 'Add'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
