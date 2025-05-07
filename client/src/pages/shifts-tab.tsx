import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Shift } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, getDay, addDays, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, Plus, Edit, Trash2, Bot, Calendar } from "lucide-react";
import AddShiftModal from "@/components/add-shift-modal";
import ConfirmModal from "@/components/confirm-modal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ShiftsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [chartView, setChartView] = useState<"weekly" | "monthly">("weekly");
  
  // Fetch shifts
  const {
    data: shifts,
    isLoading: isLoadingShifts,
    error: shiftsError,
  } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });
  
  // Generate weekly schedule data
  const weeklyScheduleData = useMemo(() => {
    if (!shifts) return [];
    
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    
    // Generate array of day objects for the current week
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.date.toString());
        return isSameDay(shiftDate, date);
      });
      
      days.push({
        date,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        isToday: isSameDay(date, today),
        hasShift: dayShifts.length > 0,
        shifts: dayShifts
      });
    }
    
    return days;
  }, [shifts]);
  
  // Fetch dashboard data
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
  } = useQuery({
    queryKey: ["/api/dashboard/data", chartView],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/data?period=${chartView}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
  
  // Fetch AI summary
  const {
    data: aiSummary,
    isLoading: isLoadingAISummary,
  } = useQuery({
    queryKey: ["/api/dashboard/summary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/summary", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch AI summary");
      return res.json();
    },
  });
  
  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      await apiRequest("DELETE", `/api/shifts/${shiftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/data"] });
      toast({
        title: "Success",
        description: "Shift has been deleted successfully",
      });
      setIsConfirmModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete shift: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleOpenAddShiftModal = (shift?: Shift) => {
    setSelectedShift(shift || null);
    setIsAddShiftModalOpen(true);
  };
  
  const handleOpenDeleteModal = (shift: Shift) => {
    setSelectedShift(shift);
    setIsConfirmModalOpen(true);
  };
  
  const handleDeleteShift = () => {
    if (selectedShift) {
      deleteShiftMutation.mutate(selectedShift.id);
    }
  };
  
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString.toString());
    return format(date, 'EEE, MMM d');
  };
  
  const calculateHours = (shift: Shift) => {
    const startTime = new Date(`1970-01-01T${shift.start_time}`);
    const endTime = new Date(`1970-01-01T${shift.end_time}`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalHours = diffHours - Number(shift.break_time);
    return totalHours.toFixed(1);
  };
  
  if (isLoadingShifts || isLoadingDashboard) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (shiftsError) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Failed to load shifts. Please try again.</p>
      </div>
    );
  }
  
  // Extract summary data
  const weeklyHours = dashboardData?.summary?.weeklyHours || 0;
  const weeklyPay = dashboardData?.summary?.weeklyPay || 0;
  const nextShift = dashboardData?.summary?.nextShift;
  
  // Prepare chart data
  const chartData = chartView === 'weekly'
    ? dashboardData?.data?.days?.map((day: any) => ({
        name: format(parseISO(day.date), 'EEE'),
        hours: parseFloat(day.hours.toFixed(1)),
        pay: parseFloat(day.pay.toFixed(2)),
      }))
    : dashboardData?.data?.weeks?.map((week: any) => ({
        name: format(parseISO(week.weekStart), 'MMM d'),
        hours: parseFloat(week.hours.toFixed(1)),
        pay: parseFloat(week.pay.toFixed(2)),
      }));
  
  return (
    <section className="space-y-6">
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              This Week's Hours
            </h3>
            <div className="flex items-end">
              <span className="text-2xl font-medium">{weeklyHours.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1 pb-0.5">hours</span>
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded">
              <div
                className="h-1 bg-primary rounded progress-animate"
                style={{ width: `${Math.min((weeklyHours / 40) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              This Week's Pay
            </h3>
            <div className="flex items-end">
              <span className="text-2xl font-medium">${weeklyPay.toFixed(2)}</span>
            </div>
            <div className="mt-2 h-1 bg-gray-200 rounded">
              <div
                className="h-1 bg-secondary rounded progress-animate"
                style={{ width: `${Math.min((weeklyPay / 500) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Next Shift
            </h3>
            {nextShift ? (
              <>
                <div className="text-lg font-medium">{nextShift.day}</div>
                <div className="text-sm text-muted-foreground">{nextShift.time}</div>
              </>
            ) : (
              <div className="text-lg font-medium">No upcoming shifts</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Hours Overview</h2>
            <div className="flex space-x-2">
              <Button
                variant={chartView === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartView("weekly")}
              >
                Weekly
              </Button>
              <Button
                variant={chartView === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartView("monthly")}
              >
                Monthly
              </Button>
            </div>
          </div>
          
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}`, 'Hours']} />
                <Bar dataKey="hours" name="Hours" radius={[4, 4, 0, 0]}>
                  {chartData?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary-light))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly Schedule */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklyScheduleData.map((day) => (
              <div key={day.dayName} className="flex flex-col items-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {day.dayName}
                </div>
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-1 schedule-day",
                    day.isToday ? "schedule-day-today" : "",
                    day.hasShift ? "schedule-day-active" : ""
                  )}
                >
                  <span className={cn(
                    "text-lg",
                    day.hasShift ? "text-secondary-foreground dark:text-green-200" : ""
                  )}>
                    {day.dayNumber}
                  </span>
                </div>
                {day.hasShift && (
                  <div className="text-xs text-muted-foreground">
                    {day.shifts.length} shift{day.shifts.length > 1 ? 's' : ''}
                  </div>
                )}
                {day.hasShift && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1 h-6 text-xs px-2"
                    onClick={() => {
                      const firstShift = day.shifts[0];
                      handleOpenAddShiftModal(firstShift);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 mr-3">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-medium">AI Insights</h2>
          </div>
          
          {isLoadingAISummary ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Generating insights...</span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mb-4">
              {aiSummary?.summary || "No data available for analysis yet."}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Shifts */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Shifts</h2>
          <Button onClick={() => handleOpenAddShiftModal()}>
            <Plus className="h-4 w-4 mr-1" /> Add Shift
          </Button>
        </div>
        
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rate</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shifts && shifts.length > 0 ? (
                  shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium">{formatDate(shift.date.toString())}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {calculateHours(shift)} <span className="text-xs">({shift.break_time}h break)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                        ${Number(shift.hourly_rate).toFixed(2)}/h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${Number(shift.total_pay).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenAddShiftModal(shift)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteModal(shift)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-muted-foreground">
                      No shifts recorded yet. Add your first shift!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      
      {/* Modals */}
      <AddShiftModal
        isOpen={isAddShiftModalOpen}
        onClose={() => setIsAddShiftModalOpen(false)}
        shift={selectedShift}
      />
      
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeleteShift}
        title="Delete Shift"
        message="Are you sure you want to delete this shift? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </section>
  );
}
