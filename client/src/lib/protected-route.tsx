import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation, Redirect, Route } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Force a check of authentication status
  useEffect(() => {
    if (!isLoading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : (
        children
      )}
    </Route>
  );
}
