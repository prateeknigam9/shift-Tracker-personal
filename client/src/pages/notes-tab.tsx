import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Shift } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  
  // Fetch shifts to display notes
  const {
    data: shifts,
    isLoading: isLoadingShifts,
    error: shiftsError,
  } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });
  
  // Process notes with AI
  const processNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await apiRequest("POST", "/api/dashboard/notes/process", { notes });
      return await res.json();
    },
    onSuccess: (data) => {
      setNoteText(data.processedNotes);
      toast({
        title: "Note enhanced",
        description: "AI has improved your note.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to process note: ${error.message || "Unknown error" || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // Update shift with notes
  const updateShiftMutation = useMutation({
    mutationFn: async ({ shiftId, notes }: { shiftId: number; notes: string }) => {
      const res = await apiRequest("PUT", `/api/shifts/${shiftId}`, { notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      setNoteText("");
      toast({
        title: "Success",
        description: "Note has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save note: ${error.message || "Unknown error" || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveNote = () => {
    if (!selectedShiftId) {
      toast({
        title: "Error",
        description: "Please select a shift to save this note to",
        variant: "destructive",
      });
      return;
    }
    
    if (!noteText.trim()) {
      toast({
        title: "Error",
        description: "Note cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    updateShiftMutation.mutate({ shiftId: selectedShiftId, notes: noteText });
  };
  
  const handleImproveNote = () => {
    if (!noteText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to improve",
        variant: "destructive",
      });
      return;
    }
    
    processNotesMutation.mutate(noteText);
  };
  
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString.toString());
    return format(date, 'EEEE, MMMM d');
  };
  
  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`;
  };
  
  if (isLoadingShifts) {
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
  
  // Sort shifts by date (newest first)
  const sortedShifts = shifts && [...shifts].sort((a, b) => {
    return new Date(b.date.toString()).getTime() - new Date(a.date.toString()).getTime();
  });
  
  // Filter shifts with notes
  const shiftsWithNotes = sortedShifts?.filter(shift => shift.notes) || [];
  
  return (
    <section className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">Shift Notes</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="notes-input" className="block text-sm font-medium text-foreground mb-1">Add new note</label>
              {shifts && shifts.length > 0 && (
                <select 
                  className="text-sm border border-input rounded px-2 py-1"
                  value={selectedShiftId || ""}
                  onChange={(e) => setSelectedShiftId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select a shift</option>
                  {sortedShifts?.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {format(parseISO(shift.date.toString()), 'MMM dd')} ({shift.start_time.substring(0, 5)}-{shift.end_time.substring(0, 5)})
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <Textarea 
              id="notes-input" 
              rows={4} 
              placeholder="Type your shift notes here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            
            <div className="flex mt-2">
              <Button 
                className="mr-2"
                onClick={handleSaveNote}
                disabled={updateShiftMutation.isPending || !selectedShiftId}
              >
                {updateShiftMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Note"
                )}
              </Button>
              
              <Button 
                variant="secondary"
                onClick={handleImproveNote}
                disabled={processNotesMutation.isPending || !noteText.trim()}
              >
                {processNotesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Improving...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-1 h-4 w-4" /> Improve with AI
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <h3 className="text-md font-medium mb-2">Recent Notes</h3>
          
          <div className="space-y-3">
            {shiftsWithNotes.length > 0 ? (
              shiftsWithNotes.map(shift => (
                <div key={shift.id} className="border-l-4 border-primary-light pl-3 py-1">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{formatDate(shift.date.toString())}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(shift.start_time, shift.end_time)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{shift.notes}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No notes recorded yet. Add your first note!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
