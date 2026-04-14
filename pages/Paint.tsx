import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Loader2, DollarSign, FileText, ShoppingCart, Calculator } from "lucide-react";

export default function Paint() {
  const { data: invoices, isLoading: loadInv } = trpc.invoices.list.useQuery();
  const { data: purchases } = trpc.purchases.list.useQuery();
  const { data: allocations } = trpc.allocations.list.useQuery();

  // Filter paint-related invoices (from paint branch) - simplification
  const totalInvoices = invoices?.length || 0;
  const totalPurchases = purchases?.reduce((s, p) => s + parseFloat(p.amount), 0) || 0;
  const activeAllocations = allocations?.filter(a => a.status === "active").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-100 to-violet-100 flex items-center justify-center">
          <Palette className="w-5 h-5 text-fuchsia-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">ورشة الصبغ</h1>
          <p className="text-sm text-muted-foreground">إدارة فواتير ومشتريات وعمليات ورشة الصبغ</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "إجمالي الفواتير", value: totalInvoices, icon: FileText, color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
          { label: "إجمالي المشتريات", value: `${totalPurchases.toFixed(3)} د.ك`, icon: ShoppingCart, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "عهد نشطة", value: activeAllocations, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold mt-0.5">{s.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-fuchsia-200 bg-fuchsia-50/30">
        <CardContent className="p-6 flex flex-col items-center text-center text-muted-foreground">
          <Palette className="h-14 w-14 mb-3 text-fuchsia-300" />
          <p className="font-medium text-base">ورشة الصبغ</p>
          <p className="text-sm mt-1 max-w-sm">هذا القسم مخصص لفواتير ومشتريات ومهام ورشة الصبغ. يتشارك البيانات مع بقية النظام ويمكن فلترة العمليات حسب الفرع.</p>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {["محاسب الصبغ", "مشتريات الصبغ", "فواتير الصبغ"].map(role => (
              <Badge key={role} variant="outline" className="text-xs border-fuchsia-300 text-fuchsia-700">{role}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
