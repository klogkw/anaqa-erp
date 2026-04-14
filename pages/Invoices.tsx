import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Search, Filter, Plus, Clock, CheckCircle2,
  AlertCircle, CreditCard, Phone, User, Calendar, Loader2,
  Receipt, DollarSign, TrendingDown, ChevronDown, ChevronUp
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "معلق", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  partial: { label: "دفع جزئي", color: "bg-blue-100 text-blue-700 border-blue-200", icon: TrendingDown },
  paid: { label: "مدفوع", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  completed: { label: "مكتمل", color: "bg-purple-100 text-purple-700 border-purple-200", icon: CheckCircle2 },
};

export default function Invoices() {
  const [, setLocation] = useLocation();
  const { data: invoicesList, isLoading } = trpc.invoices.list.useQuery();
  const { data: paymentMethods } = trpc.payments.methods.useQuery();
  const utils = trpc.useUtils();

  const addPayment = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      setShowPayDialog(false);
      setPayAmount(""); setPayMethodId(""); setTrackingNumber(""); setPayNotes("");
      utils.invoices.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethodId, setPayMethodId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const selectedMethod = paymentMethods?.find(m => m.id === parseInt(payMethodId));

  const filtered = invoicesList?.filter(inv => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerPhone || "").includes(searchQuery);
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingInvoices = invoicesList?.filter(i => i.status === "pending" || i.status === "partial") || [];
  const totalOwed = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.remainingAmount || "0"), 0);

  const openPayDialog = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(parseFloat(inv.remainingAmount || "0").toFixed(3));
    setShowPayDialog(true);
  };

  const handlePay = () => {
    if (!selectedInvoice) return;
    if (!payAmount || parseFloat(payAmount) <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    if (!payMethodId) { toast.error("اختر طريقة الدفع"); return; }
    if (selectedMethod?.requiresTrackingNumber && !trackingNumber.trim()) {
      toast.error("يجب إدخال رقم التتبع لهذه الطريقة"); return;
    }
    addPayment.mutate({
      invoiceId: selectedInvoice.id,
      amount: parseFloat(payAmount).toFixed(3),
      methodId: parseInt(payMethodId),
      trackingNumber: trackingNumber || undefined,
      notes: payNotes || undefined,
    });
  };

  const statsData = [
    { label: "إجمالي الفواتير", value: invoicesList?.length || 0, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "فواتير معلقة", value: pendingInvoices.length, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "مبالغ مستحقة", value: `${totalOwed.toFixed(3)} د.ك`, icon: DollarSign, color: "text-red-600", bg: "bg-red-50" },
    { label: "مسددة بالكامل", value: invoicesList?.filter(i => i.status === "paid" || i.status === "completed").length || 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>
            <p className="text-sm text-muted-foreground">إدارة ومتابعة الفواتير والمدفوعات</p>
          </div>
        </div>
        <Button onClick={() => setLocation("/pos")} className="gap-2 bg-gradient-to-l from-purple-500 to-pink-500 text-white">
          <Plus className="h-4 w-4" /> فاتورة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map(s => (
          <Card key={s.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold mt-0.5">{s.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pendingInvoices.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700 font-medium">
              يوجد {pendingInvoices.length} فاتورة معلقة بإجمالي مستحق {totalOwed.toFixed(3)} د.ك
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالرقم أو اسم العميل أو الهاتف..." className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="partial">دفع جزئي</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد فواتير</p>
            <p className="text-sm mt-1">أنشئ فاتورة جديدة من نقطة البيع</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => {
            const st = statusConfig[inv.status || "pending"] || statusConfig.pending;
            const StIcon = st.icon;
            const isExpanded = expandedId === inv.id;
            const remaining = parseFloat(inv.remainingAmount || "0");
            const paid = parseFloat(inv.paidAmount || "0");
            const total = parseFloat(inv.totalAmount);
            const paidPct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

            return (
              <Card key={inv.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">{inv.invoiceNumber}</span>
                          <Badge className={`text-xs border ${st.color}`}><StIcon className="w-3 h-3 ml-1" />{st.label}</Badge>
                          {inv.invoiceType === "custom" && <Badge variant="outline" className="text-xs">تفصيلية</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{inv.customerName}</span>
                          {inv.customerPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inv.customerPhone}</span>}
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(inv.createdAt).toLocaleDateString("ar-KW")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-base">{total.toFixed(3)} د.ك</p>
                      {remaining > 0 && <p className="text-xs text-red-500">متبقي: {remaining.toFixed(3)}</p>}
                    </div>
                  </div>

                  {total > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>المدفوع: {paid.toFixed(3)} د.ك</span>
                        <span>{paidPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-l from-purple-500 to-pink-400 transition-all" style={{ width: `${paidPct}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "إخفاء" : "التفاصيل"}
                    </Button>
                    {remaining > 0 && (
                      <Button size="sm" className="gap-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => openPayDialog(inv)}>
                        <CreditCard className="w-3 h-3" /> تسجيل دفعة
                      </Button>
                    )}
                  </div>

                  {isExpanded && inv.notes && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">ملاحظة: {inv.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تسجيل دفعة — {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">العميل</span><span className="font-medium">{selectedInvoice.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الإجمالي</span><span>{parseFloat(selectedInvoice.totalAmount).toFixed(3)} د.ك</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">المدفوع</span><span className="text-green-600">{parseFloat(selectedInvoice.paidAmount || "0").toFixed(3)} د.ك</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span className="text-red-600">المتبقي</span><span className="text-red-600">{parseFloat(selectedInvoice.remainingAmount || "0").toFixed(3)} د.ك</span></div>
              </div>
              <div className="space-y-1.5">
                <Label>المبلغ المدفوع (د.ك) *</Label>
                <Input type="number" step="0.001" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.000" />
              </div>
              <div className="space-y-1.5">
                <Label>طريقة الدفع *</Label>
                <Select value={payMethodId} onValueChange={setPayMethodId}>
                  <SelectTrigger><SelectValue placeholder="اختر طريقة الدفع..." /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>))}
                    {(!paymentMethods || paymentMethods.length === 0) && (
                      <SelectItem value="__none" disabled>لا توجد طرق دفع — فعّل من الإعدادات</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedMethod?.requiresTrackingNumber && (
                <div className="space-y-1.5">
                  <Label>رقم التتبع / المرجع *</Label>
                  <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="أدخل رقم التتبع..." />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="ملاحظات اختيارية..." rows={2} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setShowPayDialog(false)} className="flex-1">إلغاء</Button>
                <Button onClick={handlePay} disabled={addPayment.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2">
                  {addPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  تأكيد الدفع
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
