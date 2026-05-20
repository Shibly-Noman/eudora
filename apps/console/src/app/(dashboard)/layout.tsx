"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeCustomizer, ThemeCustomizerTrigger } from "@/components/theme-customizer";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { fetchCurrentUser } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getRequiredPermissions, hasEveryPermission } from "@/features/auth/permissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAppSelector((state) => state.auth);
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false);
  const { config } = useSidebarConfig();

  React.useEffect(() => {
    if (auth.status === "idle") {
      void dispatch(fetchCurrentUser());
    }
  }, [auth.status, dispatch]);

  React.useEffect(() => {
    if (auth.status === "unauthenticated") {
      router.replace("/sign-in");
    }
    if (auth.user?.mustChangePassword) {
      router.replace("/change-password");
    }
  }, [auth.status, auth.user?.mustChangePassword, router]);

  const requiredPermissions = getRequiredPermissions(pathname);
  const hasRouteAccess = hasEveryPermission(auth.user?.permissions, requiredPermissions);

  React.useEffect(() => {
    if (auth.status === "authenticated" && auth.user && !auth.user.mustChangePassword && !hasRouteAccess) {
      router.replace("/errors/forbidden");
    }
  }, [auth.status, auth.user, auth.user?.mustChangePassword, hasRouteAccess, router]);

  if (
    auth.status === "idle" ||
    auth.status === "loading" ||
    !auth.user ||
    auth.user.mustChangePassword ||
    !hasRouteAccess
  ) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? (
        <>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
        </>
      ) : (
        <>
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </SidebarInset>
          <AppSidebar
            variant={config.variant}
            collapsible={config.collapsible}
            side={config.side}
          />
        </>
      )}

      {/* Theme Customizer */}
      <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
      {/* <UpgradeToProButton /> */}
    </SidebarProvider>
  );
}
