import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO, addYears, subYears } from "date-fns";
import { Loader2, Plus, Calendar, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Monthly Pay
              </h3>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleChangeMonth(selectedMonth - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select 
                  value={selectedMonth.toString()} 
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[110px]">
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
                  onClick={() => handleChangeMonth(selectedMonth + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-3xl font-medium">
                ${selectedMonthData ? selectedMonthData.total.toFixed(2) : "0.00"}
              </span>
              {percentChange !== 0 && (
                <span className={`text-sm ml-2 ${percentChange > 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}% from last month
                </span>
              )}
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Monthly Target</span>
                <span className="font-medium">$1,500.00</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-secondary rounded progress-animate"
                  style={{ width: `${Math.min((selectedMonthData?.total || 0) / 1500 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pay Schedule</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleAddPaySchedule}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </Button>
            </div>
            
            {paySchedules && paySchedules.length > 0 ? (
              <div className="space-y-3">
                {/* Display last paid schedule */}
                {paySchedules
                  .filter(s => s.status === 'paid')
                  .sort((a, b) => new Date(b.pay_date as string).getTime() - new Date(a.pay_date as string).getTime())
                  .slice(0, 1)
                  .map(schedule => (
                    <div key={schedule.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Last Pay Date</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(schedule.pay_date as string).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-lg font-medium font-mono">${Number(schedule.amount).toFixed(2)}</div>
                        <Button 
                          variant="ghost" 
                          size="icon"
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
                    <div key={schedule.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Next Pay Date</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(schedule.pay_date as string).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-lg font-medium font-mono">
                          ${Number(schedule.amount).toFixed(2)} 
                          <span className="text-xs text-muted-foreground">(est.)</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditPaySchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center h-32">
                <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No pay schedules found</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleAddPaySchedule}
                >
                  Add Pay Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Pay History */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Pay History</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleAddPaySchedule}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </Button>
          </div>
          
          {paySchedules && paySchedules.length > 0 ? (
            <div className="space-y-4">
              {paySchedules
                .sort((a, b) => new Date(b.pay_date as string).getTime() - new Date(a.pay_date as string).getTime())
                .map(schedule => {
                  // Calculate hours for this pay period
                  const startDate = new Date(schedule.period_start as string);
                  const endDate = new Date(schedule.period_end as string);
                  const payDate = new Date(schedule.pay_date as string);
                  
                  const hours = Math.round(Number(schedule.amount) / 16); // Estimate hours based on average $16/hour
                  
                  return (
                    <div key={schedule.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            schedule.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : schedule.status === 'delayed' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium font-mono">${Number(schedule.amount).toFixed(2)}</span>
                          <div className="flex">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditPaySchedule(schedule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deletePayScheduleMutation.mutate(schedule.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Pay date: {payDate.toLocaleDateString()}</span>
                        <span>~{hours} hours</span>
                      </div>
                      
                      {schedule.notes && (
                        <div className="mt-2 text-sm text-muted-foreground border-l-2 border-gray-200 pl-2">
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center h-32">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No pay history found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleAddPaySchedule}
              >
                Add Pay Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Yearly Pay Calendar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Pay Calendar</h2>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleChangeYear(selectedYear - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-[80px] text-center font-medium">{selectedYear}</div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleChangeYear(selectedYear + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {yearlyData?.months?.map((month: any) => {
              const monthNames = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"
              ];
              const isCurrentMonth = month.month === selectedMonth;
              const isPastMonth = month.total > 0;
              
              return (
                <div 
                  key={month.month} 
                  className={`border border-gray-200 rounded p-3 ${isCurrentMonth ? 'bg-primary-light bg-opacity-10' : isPastMonth ? '' : 'bg-gray-50'}`}
                  onClick={() => setSelectedMonth(month.month)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="font-medium mb-1">{monthNames[month.month - 1]}</div>
                  <div className="font-mono text-sm">
                    ${month.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {month.hours.toFixed(1)} hours
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pay Schedule Dialog */}
      <Dialog open={showPayScheduleDialog} onOpenChange={setShowPayScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScheduleId ? 'Edit' : 'Add'} Pay Schedule</DialogTitle>
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPayScheduleDialog(false);
              resetPayScheduleForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPaySchedule} 
              disabled={
                createPayScheduleMutation.isPending || 
                updatePayScheduleMutation.isPending ||
                !payScheduleFormData.pay_date ||
                !payScheduleFormData.period_start ||
                !payScheduleFormData.period_end ||
                !payScheduleFormData.amount
              }
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
