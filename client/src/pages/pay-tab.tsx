import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Loader2, Plus, Calendar, Edit, Trash } from "lucide-react";
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
  const [year] = useState(new Date().getFullYear());
  
  // Fetch yearly pay summary
  const {
    data: yearlyData,
    isLoading: isLoadingYearly,
    error: yearlyError,
  } = useQuery({
    queryKey: ["/api/pay/yearly", year],
    queryFn: async () => {
      const res = await fetch(`/api/pay/yearly?year=${year}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch yearly pay summary");
      return res.json();
    },
  });
  
  if (isLoadingYearly) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (yearlyError) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Failed to load pay data. Please try again.</p>
      </div>
    );
  }
  
  // Get current month data
  const currentMonth = new Date().getMonth() + 1;
  const monthData = yearlyData?.months?.find((m: any) => m.month === currentMonth);
  
  // Get previous month data
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevMonthData = yearlyData?.months?.find((m: any) => m.month === prevMonth);
  
  // Calculate month-over-month change
  let percentChange = 0;
  if (prevMonthData?.total && monthData?.total) {
    percentChange = ((monthData.total - prevMonthData.total) / prevMonthData.total) * 100;
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
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              This Month's Pay
            </h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-medium">
                ${monthData ? monthData.total.toFixed(2) : "0.00"}
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
                  style={{ width: `${Math.min((monthData?.total || 0) / 1500 * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Pay Schedule</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Last Pay Date</div>
                  <div className="text-sm text-muted-foreground">May 15, 2023</div>
                </div>
                <div className="text-lg font-medium font-mono">$624.00</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Next Pay Date</div>
                  <div className="text-sm text-muted-foreground">May 31, 2023</div>
                </div>
                <div className="text-lg font-medium font-mono">$624.00 <span className="text-xs text-muted-foreground">(est.)</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pay History */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">Pay History</h2>
          
          <div className="space-y-4">
            {payPeriods.map((period, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{period.period}</h3>
                  <span className="font-medium font-mono">${period.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{period.hours} hours</span>
                  <span>${period.hourlyAvg.toFixed(2)}/hour avg.</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Yearly Pay Calendar */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">{year} Pay Calendar</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {yearlyData?.months?.map((month: any) => {
              const monthNames = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December"
              ];
              const isCurrentMonth = month.month === currentMonth;
              const isPastMonth = month.total > 0;
              
              return (
                <div 
                  key={month.month} 
                  className={`border border-gray-200 rounded p-3 ${isCurrentMonth ? 'bg-primary-light bg-opacity-10' : isPastMonth ? '' : 'bg-gray-50'}`}
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
    </section>
  );
}
