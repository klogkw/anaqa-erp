import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelRight,
  Receipt,
  ClipboardList,
  Users,
  HardHat,
  Truck,
  ShoppingCart,
  Warehouse,
  Calculator,
  Eye,
  Bell,
  Settings,
  FileText,
  Palette,
  Package,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663506539985/idJ9WKxHExG8pGiAn2VkDh/anaqa-logo-white_78ce3c08.png";

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles?: string[];
  section?: string;
};

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/", section: "رئيسي" },
  { icon: Receipt, label: "نقاط البيع", path: "/pos", section: "المبيعات", roles: ["admin","seller_shop","seller_workshop"] },
  { icon: FileText, label: "الفواتير", path: "/invoices", section: "المبيعات", roles: ["admin","seller_shop","seller_workshop","accountant","accountant_paint"] },
  { icon: ClipboardList, label: "الطلبيات", path: "/orders", section: "المبيعات", roles: ["admin","seller_shop","seller_workshop","foreman"] },
  { icon: HardHat, label: "لوحة الفورمن", path: "/foreman", section: "الإنتاج", roles: ["admin","foreman"] },
  { icon: Users, label: "مهام العمال", path: "/worker", section: "الإنتاج", roles: ["admin","worker"] },
  { icon: Truck, label: "التسليم", path: "/delivery", section: "الإنتاج", roles: ["admin","seller_shop","seller_workshop","foreman"] },
  { icon: ShoppingCart, label: "المشتريات", path: "/purchases", section: "المالية", roles: ["admin","manager_purchases","auditor_purchases","accountant"] },
  { icon: Warehouse, label: "المخزون", path: "/inventory", section: "المالية", roles: ["admin","manager_inventory","foreman"] },
  { icon: Calculator, label: "المحاسبة", path: "/accounting", section: "المالية", roles: ["admin","accountant","accountant_paint"] },
  { icon: Palette, label: "ورشة الصبغ", path: "/paint", section: "الورش", roles: ["admin","accountant_paint","purchases_paint","invoices_paint"] },
  { icon: Eye, label: "المدقق", path: "/auditor", section: "الإدارة", roles: ["admin","auditor","auditor_purchases"] },
  { icon: Package, label: "المنتجات", path: "/products", section: "الإدارة", roles: ["admin","seller_shop","seller_workshop"] },
  { icon: Users, label: "الموظفين", path: "/employees", section: "الإدارة", roles: ["admin","hr"] },
  { icon: Settings, label: "الإعدادات", path: "/settings", section: "الإدارة", roles: ["admin"] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[oklch(0.95_0.02_290)] via-[oklch(0.96_0.015_350)] to-[oklch(0.95_0.02_165)]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <img src={LOGO_URL} alt="أناقة" className="h-24 w-24 opacity-80" />
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-center text-foreground">
              نظام أناقة لإدارة المنجرة
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm leading-relaxed">
              يرجى تسجيل الدخول للوصول إلى لوحة التحكم وإدارة العمليات
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all text-base"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find((item) => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarRight =
        sidebarRef.current?.getBoundingClientRect().right ?? 0;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Filter menu items by role, then group by section
  const visibleItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role || "user") || user?.role === "admin"
  );

  const sections = visibleItems.reduce(
    (acc, item) => {
      const section = item.section || "أخرى";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-l-0"
          side="right"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              {!isCollapsed ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={LOGO_URL}
                    alt="أناقة"
                    className="h-9 w-9 shrink-0"
                  />
                  <span className="font-bold tracking-tight truncate text-sidebar-foreground">
                    منجرة الأناقة
                  </span>
                </div>
              ) : (
                <img
                  src={LOGO_URL}
                  alt="أناقة"
                  className="h-8 w-8 mx-auto"
                />
              )}
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="تبديل القائمة"
              >
                <PanelRight className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <ScrollArea className="h-full">
              {Object.entries(sections).map(([sectionName, items]) => (
                <div key={sectionName}>
                  {!isCollapsed && (
                    <div className="px-4 py-2 mt-2">
                      <span className="text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                        {sectionName}
                      </span>
                    </div>
                  )}
                  {isCollapsed && <Separator className="my-1 bg-sidebar-border/50" />}
                  <SidebarMenu className="px-2 py-0.5">
                    {items.map((item) => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className={`h-10 transition-all font-normal ${
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                            }`}
                          >
                            <item.icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? "text-sidebar-primary-foreground"
                                  : ""
                              }`}
                            />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </div>
              ))}
            </ScrollArea>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${
            isCollapsed ? "hidden" : ""
          }`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <span className="tracking-tight text-foreground font-medium">
                  {activeMenuItem?.label ?? "القائمة"}
                </span>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
