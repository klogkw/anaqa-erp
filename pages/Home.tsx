import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ShoppingCart, ClipboardList, Truck, TrendingUp,
  Users, Package, Loader2, BarChart3, Activity, HardHat,
  Wallet, Warehouse, Eye, Calculator, Clock, CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663506539985/idJ9WKxHExG8pGiAn2VkDh/anaqa-logo-white_78ce3c08.png";

const roleGreetings: Record<string, string> = {
  admin: "مدير النظام",
  seller_shop: "بائع المحل",
  seller_workshop: "بائع المنجرة",
  foreman: "الفورمن",
  worker: "العامل",
  accountant: "المحاسب",
  auditor: "المدقق",
  manager_purchases: "مدير المشتريات",
};

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const role = user?.role || "user";

  const statCards = [
    { title: "فواتير اليوم", value: stats?.invoicesToday ?? 0, icon: FileText, color: "from-purple-500 to-purple-600", bgColor: "from-purple-50 to-purple-100", link: "/invoices" },
    { title: "طلبيات نشطة", value: stats?.activeOrders ?? 0, icon: ShoppingCart, color: "from-pink-500 to-pink-600", bgColor: "from-pink-50 to-pink-100", link: "/orders" },
    { title: "مهام قيد التنفيذ", value: stats?.tasksInProgress ?? 0, icon: ClipboardList, color: "from-emerald-500 to-emerald-600", bgColor: "from-emerald-50 to-emerald-100", link: "/foreman" },
    { title: "تسليمات مكتملة", value: stats?.completedDeliveries ?? 0, icon: Truck, color: "from-amber-500 to-amber-600", bgColor: "from-amber-50 to-amber-100", link: "/delivery" },
  ];

  // Role-based quick links
  const allLinks = [
    { title: "نقطة بيع", icon: FileText, link: "/pos", desc: "إنشاء فاتورة جديدة", roles: ["admin","seller_shop","seller_workshop"] },
    { title: "طلبية جديدة", icon: ShoppingCart, link: "/orders", desc: "إنشاء طلبية تفصيلية", roles: ["admin","seller_shop","seller_workshop"] },
    { title: "لوحة الفورمن", icon: HardHat, link: "/foreman", desc: "توزيع المهام على العمال", roles: ["admin","foreman"] },
    { title: "مهامي", icon: ClipboardList, link: "/worker", desc: "المهام المسندة إليك", roles: ["admin","worker"] },
    { title: "التسليم", icon: Truck, link: "/delivery", desc: "تسليم المنتجات للعملاء", roles: ["admin","seller_shop","seller_workshop","foreman"] },
    { title: "المشتريات", icon: Wallet, link: "/purchases", desc: "العهد والمشتريات", roles: ["admin","manager_purchases","auditor_purchases"] },
    { title: "المخزون", icon: Warehouse, link: "/inventory", desc: "متابعة المخزون", roles: ["admin","manager_inventory","foreman"] },
    { title: "المحاسبة", icon: Calculator, link: "/accounting", desc: "التقارير المالية", roles: ["admin","accountant","accountant_paint"] },
    { title: "المنتجات", icon: Package, link: "/products", desc: "إدارة قائمة المنتجات", roles: ["admin","seller_shop","seller_workshop"] },
    { title: "الموظفين", icon: Users, link: "/employees", desc: "إدارة الفريق", roles: ["admin","hr"] },
    { title: "المدقق", icon: Eye, link: "/auditor", desc: "مراجعة الإنجازات", roles: ["admin","auditor","auditor_purchases"] },
    { title: "الفواتير", icon: BarChart3, link: "/invoices", desc: "متابعة الفواتير والمدفوعات", roles: ["admin","accountant","seller_shop","seller_workshop"] },
  ];

  const quickLinks = allLinks.filter(l => l.roles.includes(role) || role === "admin");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            مرحباً، {user?.name || "مستخدم"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roleGreetings[role] || "لوحة التحكم الرئيسية"} — نظام أناقة ERP
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs">النظام يعمل</span>
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.link}>
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br overflow-hidden group relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-60`} />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">وصول سريع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link key={item.title} href={item.link}>
              <Card className="cursor-pointer hover:shadow-md hover:border-purple-200 transition-all duration-300 group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center group-hover:from-purple-100 group-hover:to-pink-100 transition-colors shrink-0">
                    <item.icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
