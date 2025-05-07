import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation, Redirect, Route } from "wouter";
import { useEffect } from "react";

// Custom component for protection logic
function ProtectionWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Force a check of authentication status
  useEffect(() => {
    if (!isLoading && !user && location !== "/auth") {
      window.location.href = "/auth"; // Use direct navigation instead
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {/* Redirect handled via useEffect for better session handling */}
      </div>
    );
  }
  
  return <>{children}</>;
}

// Main exported component
export function ProtectedRoute({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  return (
    <Route path={path}>
      <ProtectionWrapper>
        {children}
      </ProtectionWrapper>
    </Route>
  );
}
