import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User, Lock, Calendar, ChevronRight } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-bg">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Hero section */}
        <div className="relative hidden md:flex flex-col justify-center p-8 text-white glass-effect rounded-xl animate-fade-in z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/20 backdrop-blur-md -z-10"></div>
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white/10 to-transparent -z-10"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-secondary/20 blur-3xl -z-10"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-12 w-12 text-white p-2 bg-primary/30 rounded-xl shadow-lg" />
              <h1 className="text-3xl font-bold gradient-text">ShiftTracker</h1>
            </div>
            
            <p className="text-lg">
              The easiest way to track your shifts, calculate pay, and manage your work schedule.
            </p>
            
            <ul className="space-y-4 mt-6">
              <li className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg">
                <div className="p-2 rounded-full bg-accent/20">
                  <ChevronRight className="h-5 w-5 text-white" />
                </div>
                <span>Record hours and calculate earnings</span>
              </li>
              <li className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg">
                <div className="p-2 rounded-full bg-accent/20">
                  <ChevronRight className="h-5 w-5 text-white" />
                </div>
                <span>Track payment history and schedules</span>
              </li>
              <li className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg">
                <div className="p-2 rounded-full bg-accent/20">
                  <ChevronRight className="h-5 w-5 text-white" />
                </div>
                <span>Visualize your work patterns</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Auth card */}
        <Card className="w-full animate-slide-up shadow-lg border-t-4 border-t-primary">
          <CardHeader className="pb-4 card-header-gradient">
            <CardTitle className="text-2xl font-medium text-center gradient-text">
              {isLoginView ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLoginView
                ? "Sign in to access your ShiftTracker account"
                : "Join ShiftTracker to manage your work schedule"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-2">
            {isLoginView ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            <User className="h-4 w-4" />
                          </span>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="Enter your username" 
                              className="pl-9"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            <Lock className="h-4 w-4" />
                          </span>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password"
                              className="pl-9"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full login-button btn-shine rounded-lg"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : "Sign In"}
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                      onClick={() => setIsLoginView(false)}
                    >
                      Create one
                    </button>
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="Enter your full name"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            <User className="h-4 w-4" />
                          </span>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="Choose a username" 
                              className="pl-9"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            <Lock className="h-4 w-4" />
                          </span>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a strong password"
                              className="pl-9"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-muted-foreground">
                            <Lock className="h-4 w-4" />
                          </span>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm your password"
                              className="pl-9"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full login-button btn-shine rounded-lg"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : "Create Account"}
                  </Button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                      onClick={() => setIsLoginView(true)}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
