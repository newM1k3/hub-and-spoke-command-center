/* ============================================================
   App.tsx — Hub-and-Spoke Command Center
   Theme: Minimal Dark Forge | Default: dark
   Routes: / (Dashboard), /spoke-tracker, /prompt-vault
   ============================================================ */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import SpokeTracker from "./pages/SpokeTracker";
import PromptVault from "./pages/PromptVault";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/spoke-tracker" component={SpokeTracker} />
        <Route path="/prompt-vault" component={PromptVault} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.185 0.012 264)",
                border: "1px solid oklch(1 0 0 / 10%)",
                color: "oklch(0.92 0.005 264)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
