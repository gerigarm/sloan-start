import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import EnergyBar from "@/components/EnergyBar";

const AppLayout = () => {
  const { pathname } = useLocation();
  const hideEnergyBar = pathname === "/onboarding";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 sticky top-0 z-50 bg-background">
            <SidebarTrigger />
            {!hideEnergyBar && <EnergyBar />}
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
