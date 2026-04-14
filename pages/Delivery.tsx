import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Truck, Search, Camera, CheckCircle2, AlertCircle,
  Clock, User, FileText, Loader2, Package, Calendar, DollarSign, Lock
} from "lucide-react";
import { toast } from "sonner";

export default function Delivery() {
  const { data: deliveriesList, isLoading } = trpc.deliveries.list.useQuery();
  const { data: orders } = trpc.orders.list.useQuery({ status: "completed" });
  const { data: invoicesList } = trpc.invoices.list.useQuery();
  const utils = trpc.useUtils();

  const createDelivery = trpc.deliveries.create.useMutation({
    onSuccess: () => {
      toast.success("تم تسليم المنتج بنجاح وتحديث حالة الطلبية");
      setShowDeliverDialog(false);
      resetForm();
      utils.deliveries.list.invalidate();
      utils.orders.list.invalidate();
      utils.invoices.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeliverDialog, setShowDeliverDialog] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const resetForm = () => { setOrderId(""); setInvoiceId(""); setReceivedBy(""); setDeliveryNotes(""); };

  // Find invoices that are fully paid
  const paidInvoices = invoicesList?.filter(i => i.status === "paid" || i.status === "completed") || [];
  // Completed orders ready for delivery
  const readyOrders = orders || [];

  const selectedInvoice = invoicesList?.find(i => i.id === parseInt(invoiceId));
  const isInvoicePaid = selectedInvoice && (selectedInvoice.status === "paid" || selectedInvoice.status === "completed");

  const handleDeliver = () => {
    if (!orderId) { toast.error("اختر الطلبية"); return; }
    if (!invoiceId) { toast.error("اختر الفاتورة"); return; }
    if (!isInvoicePaid) { toast.error("لا يمكن التسليم — الفاتورة لم تُسدَّد بالكامل"); return; }
    createDelivery.mutate({
      orderId: parseInt(orderId),
      invoiceId: parseInt(invoiceId),
      receivedBy: receivedBy || undefined,
      notes: deliveryNotes || undefined,
    });
  };

  const counts = {
    pending: readyOrders.length,
    completed: deliveriesList?.filter(d => d.status === "completed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التسليم</h1>
            <p className="text-sm text-muted-foreground">تسليم المنتجات بعد اكتمال الدفع</p>
          </div>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowDeliverDialog(true)}>
          <Truck className="h-4 w-4" /> تسجيل تسليم
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">بانتظار التسليم</p>
                <p className="text-2xl font-bold mt-0.5">{counts.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-50"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">تم التسليم</p>
                <p className="text-2xl font-bold mt-0.5">{counts.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment reminder */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 flex items-start gap-2">
          <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">تنبيه مهم</p>
            <p className="text-xs mt-0.5">لا يمكن تسليم أي منتج إلا بعد التأكد من سداد قيمة الفاتورة بالكامل. يجب التحقق وأخذ صورة للمنتج قبل التسليم.</p>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : !deliveriesList || deliveriesList.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Camera className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد عمليات تسليم</p>
            <p className="text-sm mt-1">سجّل عملية تسليم بعد التحقق من الدفع الكامل</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliveriesList.map(dlv => (
            <Card key={dlv.id} className="border border-border/50 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-bold text-sm">{dlv.deliveryNumber}</span>
                    <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">تم التسليم</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dlv.deliveryDate ? new Date(dlv.deliveryDate).toLocaleDateString("ar-KW") : "—"}
                  </span>
                </div>
                {dlv.receivedBy && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> استلم: {dlv.receivedBy}
                  </p>
                )}
                {dlv.notes && <p className="text-xs text-muted-foreground">{dlv.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delivery Dialog */}
      <Dialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تسجيل عملية تسليم</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>الطلبية (مكتملة) *</Label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger><SelectValue placeholder="اختر الطلبية المكتملة..." /></SelectTrigger>
                <SelectContent>
                  {readyOrders.map(o => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.orderNumber} — {o.customerName}
                    </SelectItem>
                  ))}
                  {readyOrders.length === 0 && (
                    <SelectItem value="__none" disabled>لا توجد طلبيات مكتملة جاهزة للتسليم</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الفاتورة المرتبطة *</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId}>
                <SelectTrigger><SelectValue placeholder="اختر الفاتورة..." /></SelectTrigger>
                <SelectContent>
                  {invoicesList?.map(inv => (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      {inv.invoiceNumber} — {inv.customerName}
                      {(inv.status === "paid" || inv.status === "completed") ? " ✓ مسددة" : " ⚠ غير مسددة"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedInvoice && !isInvoicePaid && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  هذه الفاتورة لم تُسدَّد بالكامل — متبقي: {parseFloat(selectedInvoice.remainingAmount || "0").toFixed(3)} د.ك
                </p>
              )}
              {selectedInvoice && isInvoicePaid && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> الفاتورة مسددة بالكامل ✓
                </p>
              )}
            </div>
            <div className="p-4 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-emerald-400/50 transition-colors">
              <Camera className="w-8 h-8 opacity-40" />
              <p className="text-sm">صورة المنتج قبل التسليم</p>
              <p className="text-xs opacity-60">يُنصح بالتصوير لتوثيق حالة المنتج</p>
            </div>
            <div className="space-y-1.5">
              <Label>استُلم من قبل</Label>
              <Input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="اسم المستلم..." />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} placeholder="ملاحظات التسليم..." rows={2} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeliverDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleDeliver} disabled={createDelivery.isPending || !isInvoicePaid} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                {createDelivery.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد التسليم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
