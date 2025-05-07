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
      window.location.href = "/auth"; // Use direct navigation instead
    }
  }, [user, isLoading, location]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !user ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {/* Redirect handled via useEffect for better session handling */}
        </div>
      ) : (
        children
      )}
    </Route>
  );
}
