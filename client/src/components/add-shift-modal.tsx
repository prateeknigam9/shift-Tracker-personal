import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shift } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: Shift | null;
}

export default function AddShiftModal({ isOpen, onClose, shift }: AddShiftModalProps) {
  const { toast } = useToast();
  const isEditMode = !!shift;
  
  // Form state
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [breakTime, setBreakTime] = useState<string>("0.5");
  const [hourlyRate, setHourlyRate] = useState<string>("16.00");
  const [notes, setNotes] = useState<string>("");
  
  // Calculated totals
  const [totalHours, setTotalHours] = useState<number>(0);
  const [totalPay, setTotalPay] = useState<number>(0);
  
  // Initialize form with shift data if in edit mode
  useEffect(() => {
    if (shift) {
      setDate(shift.date.toString());
      setStartTime(shift.start_time.substring(0, 5));
      setEndTime(shift.end_time.substring(0, 5));
      setBreakTime(shift.break_time.toString());
      setHourlyRate(shift.hourly_rate.toString());
      setNotes(shift.notes || "");
    } else {
      // Reset form for new shift
      setDate(format(new Date(), "yyyy-MM-dd"));
      setStartTime("09:00");
      setEndTime("17:00");
      setBreakTime("0.5");
      setHourlyRate("16.00");
      setNotes("");
    }
  }, [shift, isOpen]);
  
  // Calculate totals whenever inputs change
  useEffect(() => {
    // Calculate hours
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    // Handle case where end time is earlier than start time (next day)
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add a day
    }
    
    const diffHours = diffMs / (1000 * 60 * 60);
    const break_time = parseFloat(breakTime) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    
    const hours = Math.max(0, diffHours - break_time);
    setTotalHours(hours);
    setTotalPay(hours * rate);
  }, [startTime, endTime, breakTime, hourlyRate]);
  
  // Create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: async (shiftData: any) => {
      const res = await apiRequest("POST", "/api/shifts", shiftData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/data"] });
      toast({
        title: "Success",
        description: "Shift has been added successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add shift: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update shift mutation
  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, shiftData }: { id: number; shiftData: any }) => {
      const res = await apiRequest("PUT", `/api/shifts/${id}`, shiftData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/data"] });
      toast({
        title: "Success",
        description: "Shift has been updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update shift: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const shiftData = {
      date,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      break_time: parseFloat(breakTime),
      hourly_rate: parseFloat(hourlyRate),
      notes,
      total_pay: totalPay
    };
    
    if (isEditMode && shift) {
      updateShiftMutation.mutate({ id: shift.id, shiftData });
    } else {
      createShiftMutation.mutate(shiftData);
    }
  };
  
  const isPending = createShiftMutation.isPending || updateShiftMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Shift" : "Add New Shift"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="shift-date">Date</Label>
            <Input
              id="shift-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shift-start">Start Time</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="shift-end">End Time</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shift-break">Break (hours)</Label>
              <Input
                id="shift-break"
                type="number"
                min="0"
                step="0.25"
                value={breakTime}
                onChange={(e) => setBreakTime(e.target.value)}
                placeholder="0.5"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="shift-rate">Hourly Rate ($)</Label>
              <Input
                id="shift-rate"
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="16.00"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="shift-notes">Notes</Label>
            <Textarea
              id="shift-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this shift..."
            />
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Hours:</span>
              <span className="font-medium">{totalHours.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-medium">Total Pay:</span>
              <span className="font-medium">${totalPay.toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                isEditMode ? "Update Shift" : "Save Shift"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
