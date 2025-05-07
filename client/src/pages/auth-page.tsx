import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

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
  const [testInput, setTestInput] = useState("");
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
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-primary">
              {isLoginView ? "ShiftTracker" : "Create Account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLoginView
                ? "Track your shifts. Calculate your pay."
                : "Join ShiftTracker to manage your work schedule"}
            </p>
  
          </div>

          {isLoginView ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input 
                  type="text"
                  value={loginForm.watch('username')}
                  onChange={(e) => loginForm.setValue('username', e.target.value)}
                  placeholder="Enter your username"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input 
                  type="password"
                  value={loginForm.watch('password')}
                  onChange={(e) => loginForm.setValue('password', e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-2 border rounded"
                />
              </div>

              <button
                onClick={() => loginForm.handleSubmit(onLoginSubmit)()}
                className="w-full p-2 bg-primary text-white rounded"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Log In"}
              </button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setIsLoginView(false)}
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input 
                  type="text"
                  value={registerForm.watch('full_name')}
                  onChange={(e) => registerForm.setValue('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input 
                  type="text"
                  value={registerForm.watch('username')}
                  onChange={(e) => registerForm.setValue('username', e.target.value)}
                  placeholder="Choose a username"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input 
                  type="password"
                  value={registerForm.watch('password')}
                  onChange={(e) => registerForm.setValue('password', e.target.value)}
                  placeholder="Create a password"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <input 
                  type="password"
                  value={registerForm.watch('confirmPassword')}
                  onChange={(e) => registerForm.setValue('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full p-2 border rounded"
                />
              </div>

              <button
                onClick={() => registerForm.handleSubmit(onRegisterSubmit)()}
                className="w-full p-2 bg-primary text-white rounded"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setIsLoginView(true)}
                >
                  Log In
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
