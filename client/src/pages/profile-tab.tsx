import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Download, Upload, Award, DollarSign, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Profile update schema
const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
});

// Password update schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfileTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Fetch user achievements
  const {
    data: achievements,
    isLoading: isLoadingAchievements,
  } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
  });
  
  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message || "Unknown error" || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await apiRequest("PUT", "/api/profile/password", data);
      return await res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update password: ${error.message || "Unknown error" || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      window.open('/api/backup/export', '_blank');
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Your data has been exported as a CSV file",
      });
    },
  });
  
  // Import data mutation
  const importDataMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({
        title: "Import successful",
        description: `${data.imported} shifts imported successfully`,
      });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormData) => {
    updatePasswordMutation.mutate(data);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleImport = () => {
    if (selectedFile) {
      importDataMutation.mutate(selectedFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
    }
  };
  
  const dummyAchievements = [
    {
      id: 1,
      title: "50 Hours Milestone",
      description: "You've worked more than 50 hours! Keep up the good work.",
      icon: <Award className="h-5 w-5 text-primary" />,
      bgColor: "bg-primary-light"
    },
    {
      id: 2,
      title: "€1000 Earned",
      description: "You've earned over €1000! Your hard work is paying off.",
      icon: <span className="h-5 w-5 flex items-center justify-center text-secondary font-bold">€</span>,
      bgColor: "bg-secondary-light"
    },
    {
      id: 3,
      title: "10 Shifts Completed",
      description: "You've completed 10 shifts! You're becoming a pro.",
      icon: <CalendarCheck className="h-5 w-5 text-accent" />,
      bgColor: "bg-accent-light"
    }
  ];
  
  const displayAchievements = achievements || dummyAchievements;
  
  return (
    <section className="space-y-6">
      {/* User Information */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">Profile Information</h2>
          
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label htmlFor="profile-username">Username</Label>
                <Input 
                  id="profile-username" 
                  value={user?.username || ""} 
                  className="bg-muted"
                  readOnly 
                />
                <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
              </div>
              
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Change Password */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">Change Password</h2>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter your current password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter your new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Confirm your new password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={updatePasswordMutation.isPending}
              >
                {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Achievements */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">Your Achievements</h2>
          
          {isLoadingAchievements ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start p-3 border border-gray-200 rounded">
                  <div className={`flex-shrink-0 ${achievement.bgColor || 'bg-primary/10'} rounded-full p-2 mr-3`}>
                    {achievement.icon || <Award className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-medium">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Data Backup */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">Backup & Export</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Export Your Data</h3>
              <p className="text-sm text-muted-foreground mb-3">Download all your shifts as a CSV file that you can open in Excel or other spreadsheet software.</p>
              <Button 
                variant="default" 
                onClick={() => exportDataMutation.mutate()}
              >
                <Download className="mr-1 h-4 w-4" /> Export as CSV
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium mb-2">Import Data</h3>
              <p className="text-sm text-muted-foreground mb-3">Upload a CSV file to import shifts. This will not overwrite your existing shifts.</p>
              <div className="flex items-center flex-wrap gap-2">
                <Label htmlFor="import-file" className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                  <Upload className="inline-block mr-1 h-4 w-4" /> Select CSV
                </Label>
                <Input 
                  id="import-file" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </span>
                {selectedFile && (
                  <Button 
                    variant="outline" 
                    onClick={handleImport}
                    disabled={importDataMutation.isPending}
                  >
                    {importDataMutation.isPending ? "Importing..." : "Import"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
