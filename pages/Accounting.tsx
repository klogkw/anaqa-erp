import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator, DollarSign, TrendingUp, TrendingDown,
  Loader2, FileText, CreditCard, CheckCircle2, Clock, BarChart3
} from "lucide-react";

const paymentMethodColors: Record<string, string> = {
  cash: "bg-green-100 text-green-700",
  knet: "bg-blue-100 text-blue-700",
  bookey: "bg-purple-100 text-purple-700",
  credit: "bg-orange-100 text-orange-700",
};

export default function Accounting() {
  const { data: invoices, isLoading: loadInv } = trpc.invoices.list.useQuery();
  const { data: payments, isLoading: loadPay } = trpc.payments.list.useQuery();
  const { data: allocations } = trpc.allocations.list.useQuery();
  const { data: purchases } = trpc.purchases.list.useQuery();
  const { data: paymentMethods } = trpc.payments.methods.useQuery();

  const totalSales = invoices?.reduce((s, i) => s + parseFloat(i.totalAmount), 0) || 0;
  const totalCollected = invoices?.reduce((s, i) => s + parseFloat(i.paidAmount || "0"), 0) || 0;
  const totalOwed = totalSales - totalCollected;
  const totalPurchases = purchases?.reduce((s, p) => s + parseFloat(p.amount), 0) || 0;

  const byMethod: Record<string, number> = {};
  payments?.forEach(p => {
    const method = paymentMethods?.find(m => m.id === p.methodId);
    const code = method?.code || "other";
    byMethod[code] = (byMethod[code] || 0) + parseFloat(p.amount);
  });

  const pending = invoices?.filter(i => i.status === "pending" || i.status === "partial") || [];
  const paid = invoices?.filter(i => i.status === "paid" || i.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">المحاسبة</h1>
          <p className="text-sm text-muted-foreground">ملخص مالي شامل للعمليات</p>
        </div>
      </div>

      {/* Main financials */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المبيعات", value: `${totalSales.toFixed(3)} د.ك`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "إجمالي المحصّل", value: `${totalCollected.toFixed(3)} د.ك`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "مبالغ مستحقة", value: `${totalOwed.toFixed(3)} د.ك`, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
          { label: "إجمالي المشتريات", value: `${totalPurchases.toFixed(3)} د.ك`, icon: TrendingDown, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-base font-bold mt-0.5">{s.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payments by method */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> المدفوعات حسب الطريقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadPay ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : Object.keys(byMethod).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا توجد مدفوعات مسجلة بعد</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byMethod).map(([code, amount]) => {
                  const method = paymentMethods?.find(m => m.code === code);
                  const total = Object.values(byMethod).reduce((s, v) => s + v, 0);
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <div key={code} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{method?.name || code}</span>
                        <span>{amount.toFixed(3)} د.ك ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-l from-rose-400 to-pink-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice summary */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" /> ملخص الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadInv ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "إجمالي الفواتير", value: invoices?.length || 0, icon: FileText, color: "text-slate-600" },
                  { label: "فواتير مسددة بالكامل", value: paid.length, icon: CheckCircle2, color: "text-green-600" },
                  { label: "فواتير معلقة / جزئية", value: pending.length, icon: Clock, color: "text-yellow-600" },
                  { label: "معدل التحصيل", value: `${totalSales > 0 ? ((totalCollected / totalSales) * 100).toFixed(0) : 0}%`, icon: BarChart3, color: "text-blue-600" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                      <span className="text-sm">{s.label}</span>
                    </div>
                    <span className="font-bold text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending invoices table */}
      {pending.length > 0 && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" /> الفواتير المستحقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                  <div>
                    <span className="font-medium text-sm">{inv.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground mr-2">{inv.customerName}</span>
                    {inv.customerPhone && <span className="text-xs text-muted-foreground mr-1">— {inv.customerPhone}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{parseFloat(inv.remainingAmount || "0").toFixed(3)} د.ك</p>
                    <p className="text-xs text-muted-foreground">من {parseFloat(inv.totalAmount).toFixed(3)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
