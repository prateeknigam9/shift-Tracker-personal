import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import AdminPage from "@/pages/admin-page";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <ProtectedRoute path="/">
              <HomePage />
            </ProtectedRoute>
            <ProtectedRoute path="/admin">
              <AdminPage />
            </ProtectedRoute>
            <Route path="/auth">
              <AuthPage />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
