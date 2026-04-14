import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ClipboardList, Plus, Loader2, Calendar, Building2,
  FileText, Clock, CheckCircle2, AlertCircle, Package,
  Search, User, Info, ChevronDown, ChevronUp, Truck
} from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new:         { label: "جديدة",        color: "bg-blue-100 text-blue-700 border-blue-200",     icon: AlertCircle },
  assigned:    { label: "موزعة",        color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  in_progress: { label: "قيد التنفيذ", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Package },
  completed:   { label: "مكتملة",      color: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  delivered:   { label: "تم التسليم", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Truck },
};

export default function Orders() {
  const { user } = useAuth();

  // seller_shop sees only their orders; everyone else sees all
  const isShopSeller = user?.role === "seller_shop";
  const { data: orders, isLoading } = trpc.orders.list.useQuery(
    isShopSeller ? { createdBy: user?.id } : undefined
  );
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: branches } = trpc.branches.list.useQuery();
  const utils = trpc.useUtils();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء الطلبية بنجاح");
      setShowCreate(false);
      resetForm();
      utils.orders.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const resetForm = () => {
    setInvoiceId(""); setBranchId(""); setCustomerName(""); setDescription(""); setAdditionalDetails(""); setExpectedDate("");
  };

  const handleCreate = () => {
    if (!customerName.trim()) { toast.error("أدخل اسم العميل"); return; }
    if (!branchId) { toast.error("اختر الفرع"); return; }
    if (!description.trim()) { toast.error("أدخل وصف الطلبية"); return; }
    createOrder.mutate({
      customerName,
      invoiceId: invoiceId ? parseInt(invoiceId) : undefined,
      branchId: parseInt(branchId),
      description: description || undefined,
      expectedCompletionDate: expectedDate || undefined,
      additionalDetails: additionalDetails || undefined,
    });
  };

  const filtered = orders?.filter(o => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    new: orders?.filter(o => o.status === "new").length || 0,
    active: orders?.filter(o => o.status === "in_progress" || o.status === "assigned").length || 0,
    done: orders?.filter(o => o.status === "completed" || o.status === "delivered").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الطلبيات</h1>
            <p className="text-sm text-muted-foreground">
              {isShopSeller ? "طلبياتك من المحل" : "جميع الطلبيات من كل الأفرع"}
            </p>
          </div>
        </div>
        <Button
          className="gap-2 bg-gradient-to-l from-pink-500 to-purple-500 text-white"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" /> طلبية جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "جديدة", count: counts.new, color: "text-blue-600", bg: "bg-blue-50", icon: AlertCircle },
          { label: "قيد التنفيذ", count: counts.active, color: "text-orange-600", bg: "bg-orange-50", icon: Clock },
          { label: "مكتملة", count: counts.done, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
        ].map(c => (
          <Card key={c.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{c.count}</p>
                </div>
                <div className={`p-2 rounded-lg ${c.bg}`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالرقم أو اسم العميل..." className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد طلبيات</p>
            <p className="text-sm mt-1">أنشئ طلبية جديدة بالضغط على الزر أعلاه</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const st = statusConfig[order.status || "new"] || statusConfig.new;
            const StIcon = st.icon;
            const isExpanded = expandedId === order.id;
            const linkedInvoice = invoices?.find(i => i.id === order.invoiceId);
            const branch = branches?.find(b => b.id === order.branchId);

            return (
              <Card key={order.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4 text-pink-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">{order.orderNumber}</span>
                          <Badge className={`text-xs border ${st.color}`}><StIcon className="w-3 h-3 ml-1" />{st.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customerName}</span>
                          {branch && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{branch.name}</span>}
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(order.createdAt).toLocaleDateString("ar-KW")}</span>
                          {order.expectedCompletionDate && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-3 h-3" />التسليم: {new Date(order.expectedCompletionDate).toLocaleDateString("ar-KW")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {linkedInvoice && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <FileText className="w-3 h-3 ml-1" />{linkedInvoice.invoiceNumber}
                      </Badge>
                    )}
                  </div>

                  {order.description && (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2 line-clamp-2">{order.description}</p>
                  )}

                  {(order.additionalDetails) && (
                    <>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? "إخفاء التفاصيل" : "تفاصيل إضافية"}
                      </Button>
                      {isExpanded && (
                        <div className="pt-1 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">{order.additionalDetails}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إنشاء طلبية جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اسم العميل *</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="اسم العميل..." />
              </div>
              <div className="space-y-1.5">
                <Label>الفرع *</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="اختر الفرع..." /></SelectTrigger>
                  <SelectContent>
                    {branches?.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ربط بفاتورة (اختياري)</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId}>
                <SelectTrigger><SelectValue placeholder="اختر فاتورة موجودة..." /></SelectTrigger>
                <SelectContent>
                  {invoices?.map(inv => (
                    <SelectItem key={inv.id} value={inv.id.toString()}>
                      {inv.invoiceNumber} — {inv.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>وصف الطلبية / التفاصيل *</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="اوصف الطلبية بالتفصيل: المقاسات، الخامة، اللون، الشكل..."
                rows={4}
              />
            </div>
            <div className="p-4 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-pink-300/60 transition-colors">
              <FileText className="w-7 h-7 opacity-40" />
              <p className="text-sm">رفع رسم أو صورة مرجعية</p>
              <p className="text-xs opacity-60">اختياري — PNG، JPG، PDF</p>
            </div>
            <div className="space-y-1.5">
              <Label>تفاصيل إضافية / ملاحظات</Label>
              <Textarea
                value={additionalDetails}
                onChange={e => setAdditionalDetails(e.target.value)}
                placeholder="أي ملاحظات للفورمن والعمال..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>تاريخ التسليم المتوقع</Label>
              <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleCreate} disabled={createOrder.isPending} className="flex-1 bg-gradient-to-l from-pink-500 to-purple-500 text-white gap-2">
                {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إنشاء الطلبية
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
