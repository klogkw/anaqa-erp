import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import POS from "./pages/POS";
import Invoices from "./pages/Invoices";
import Orders from "./pages/Orders";
import Foreman from "./pages/Foreman";
import Worker from "./pages/Worker";
import Delivery from "./pages/Delivery";
import Purchases from "./pages/Purchases";
import Inventory from "./pages/Inventory";
import Accounting from "./pages/Accounting";
import Paint from "./pages/Paint";
import Auditor from "./pages/Auditor";
import Products from "./pages/Products";
import Employees from "./pages/Employees";
import SettingsPage from "./pages/Settings";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/pos"} component={POS} />
        <Route path={"/invoices"} component={Invoices} />
        <Route path={"/orders"} component={Orders} />
        <Route path={"/foreman"} component={Foreman} />
        <Route path={"/worker"} component={Worker} />
        <Route path={"/delivery"} component={Delivery} />
        <Route path={"/purchases"} component={Purchases} />
        <Route path={"/inventory"} component={Inventory} />
        <Route path={"/accounting"} component={Accounting} />
        <Route path={"/paint"} component={Paint} />
        <Route path={"/auditor"} component={Auditor} />
        <Route path={"/products"} component={Products} />
        <Route path={"/employees"} component={Employees} />
        <Route path={"/settings"} component={SettingsPage} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
