import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Building2, MapPin, Bell, Shield, CreditCard, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const seedBranches = trpc.seed.branches.useMutation({
    onSuccess: () => toast.success("تم إنشاء الفروع الافتراضية بنجاح"),
    onError: (err) => toast.error(err.message),
  });
  const seedPayments = trpc.payments.seedMethods.useMutation({
    onSuccess: () => toast.success("تم إنشاء طرق الدفع بنجاح"),
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">إعدادات النظام والفروع والصلاحيات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* التهيئة الأولية */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              التهيئة الأولية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              قم بتشغيل هذه الأوامر مرة واحدة فقط لإنشاء البيانات الأساسية للنظام.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => seedBranches.mutate()}
                disabled={seedBranches.isPending}
                className="w-full bg-gradient-to-l from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {seedBranches.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Building2 className="w-4 h-4 ml-2" />}
                إنشاء الفروع الافتراضية
              </Button>
              <Button
                onClick={() => seedPayments.mutate()}
                disabled={seedPayments.isPending}
                variant="outline"
                className="w-full"
              >
                {seedPayments.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CreditCard className="w-4 h-4 ml-2" />}
                إنشاء طرق الدفع
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الحساب */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-pink-500" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">الاسم</span>
              <span className="text-sm font-medium">{user?.name || "غير محدد"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
              <span className="text-sm font-medium">{user?.email || "غير محدد"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">الدور</span>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                {user?.role === "admin" ? "مدير النظام" : "مستخدم"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* معلومات الشركة */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات الشركة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الشركة</Label>
              <Input defaultValue="منجرة الأناقة" />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input placeholder="رقم هاتف الشركة" />
            </div>
            <Button onClick={() => toast.success("تم الحفظ - هذه الميزة قيد التطوير")} className="w-full">
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>

        {/* الفروع */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              الفروع والمواقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["المنجرة", "ورشة الصبغ", "محل المطوع", "محل الياقوت", "محل الضجيج"].map((branch) => (
              <div key={branch} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
                <span className="text-sm font-medium">{branch}</span>
                <Button variant="outline" size="sm" onClick={() => toast.info("إعدادات الفرع - قيد التطوير")}>
                  إعدادات
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* الأدوار والصلاحيات */}
        <Card className="border border-border/50 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              الأدوار والصلاحيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                "مدير النظام (Admin)",
                "بائع محل",
                "بائع منجرة",
                "فورمن",
                "عامل / نجار",
                "محاسب",
                "مدير مشتريات",
                "مدقق",
                "مصمم",
              ].map((role) => (
                <div key={role} className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-card/30">
                  <span className="text-sm">{role}</span>
                  <Button variant="ghost" size="sm" onClick={() => toast.info("تعديل الصلاحيات - قيد التطوير")}>
                    تعديل
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
