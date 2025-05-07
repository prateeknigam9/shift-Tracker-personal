import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/">
              <HomePage />
            </Route>
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
