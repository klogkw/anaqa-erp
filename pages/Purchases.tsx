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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart, Plus, Search, Upload, Wallet, Receipt,
  Loader2, DollarSign, CheckCircle2, AlertCircle, Calendar,
  User, FileText, TrendingDown, Building2
} from "lucide-react";
import { toast } from "sonner";

export default function Purchases() {
  const { data: allocations, isLoading: loadingAlloc } = trpc.allocations.list.useQuery();
  const { data: purchasesList, isLoading: loadingPurch } = trpc.purchases.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const createAlloc = trpc.allocations.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء العهدة بنجاح"); setShowAllocDialog(false); resetAllocForm(); utils.allocations.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const createPurchase = trpc.purchases.create.useMutation({
    onSuccess: () => { toast.success("تم تسجيل المشتراة بنجاح"); setShowPurchDialog(false); resetPurchForm(); utils.purchases.list.invalidate(); utils.allocations.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [showAllocDialog, setShowAllocDialog] = useState(false);
  const [showPurchDialog, setShowPurchDialog] = useState(false);
  const [allocManagerId, setAllocManagerId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [allocNotes, setAllocNotes] = useState("");
  const [purchAllocId, setPurchAllocId] = useState("");
  const [purchVendor, setPurchVendor] = useState("");
  const [purchDesc, setPurchDesc] = useState("");
  const [purchAmount, setPurchAmount] = useState("");
  const [purchNotes, setPurchNotes] = useState("");

  const resetAllocForm = () => { setAllocManagerId(""); setAllocAmount(""); setAllocNotes(""); };
  const resetPurchForm = () => { setPurchAllocId(""); setPurchVendor(""); setPurchDesc(""); setPurchAmount(""); setPurchNotes(""); };

  const managers = users?.filter(u => u.role === "manager_purchases" || u.role === "admin") || [];

  const handleCreateAlloc = () => {
    if (!allocManagerId) { toast.error("اختر مدير المشتريات"); return; }
    if (!allocAmount || parseFloat(allocAmount) <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    createAlloc.mutate({ managerId: parseInt(allocManagerId), amount: parseFloat(allocAmount).toFixed(3), notes: allocNotes || undefined });
  };

  const handleCreatePurchase = () => {
    if (!purchAllocId) { toast.error("اختر العهدة"); return; }
    if (!purchVendor.trim()) { toast.error("أدخل اسم المورد"); return; }
    if (!purchDesc.trim()) { toast.error("أدخل وصف المشتراة"); return; }
    if (!purchAmount || parseFloat(purchAmount) <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    createPurchase.mutate({
      allocationId: parseInt(purchAllocId),
      vendorName: purchVendor,
      itemDescription: purchDesc,
      amount: parseFloat(purchAmount).toFixed(3),
      notes: purchNotes || undefined,
    });
  };

  const totalAllocated = allocations?.reduce((s, a) => s + parseFloat(a.amount), 0) || 0;
  const totalSpent = allocations?.reduce((s, a) => s + (parseFloat(a.amount) - parseFloat(a.remainingAmount)), 0) || 0;
  const totalRemaining = totalAllocated - totalSpent;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">المشتريات</h1>
            <p className="text-sm text-muted-foreground">إدارة العهد المالية وتسجيل المشتريات</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowAllocDialog(true)}>
            <Wallet className="h-4 w-4" /> عهدة جديدة
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowPurchDialog(true)}>
            <Plus className="h-4 w-4" /> مشتراة جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي العهد", value: `${totalAllocated.toFixed(3)} د.ك`, icon: Wallet, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "إجمالي المصروف", value: `${totalSpent.toFixed(3)} د.ك`, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
          { label: "المتبقي", value: `${totalRemaining.toFixed(3)} د.ك`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
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

      {/* Allocations */}
      <div>
        <h2 className="text-base font-semibold mb-3">العهد المالية</h2>
        {loadingAlloc ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : !allocations || allocations.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Wallet className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">لا توجد عهد — أنشئ عهدة جديدة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allocations.map(alloc => {
              const total = parseFloat(alloc.amount);
              const remaining = parseFloat(alloc.remainingAmount);
              const spent = total - remaining;
              const spentPct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
              const manager = users?.find(u => u.id === alloc.managerId);
              return (
                <Card key={alloc.id} className="border border-border/50 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm">{alloc.allocationNumber}</span>
                        <Badge className={`mr-2 text-xs border ${alloc.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {alloc.status === "active" ? "نشطة" : alloc.status === "completed" ? "مكتملة" : "ملغاة"}
                        </Badge>
                      </div>
                      <span className="font-bold text-sm">{total.toFixed(3)} د.ك</span>
                    </div>
                    {manager && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{manager.name}</p>}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>مصروف: {spent.toFixed(3)} د.ك</span>
                        <span>متبقي: {remaining.toFixed(3)} د.ك</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-blue-400 transition-all" style={{ width: `${spentPct}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchases list */}
      <div>
        <h2 className="text-base font-semibold mb-3">سجل المشتريات</h2>
        {loadingPurch ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : !purchasesList || purchasesList.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Receipt className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">لا توجد مشتريات مسجلة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {purchasesList.map(p => (
              <Card key={p.id} className="border border-border/50 shadow-sm">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.purchaseNumber}</span>
                        <Badge variant="outline" className="text-xs">{p.vendorName}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.itemDescription}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm shrink-0">{parseFloat(p.amount).toFixed(3)} د.ك</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Allocation Dialog */}
      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إنشاء عهدة مالية</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>مدير المشتريات *</Label>
              <Select value={allocManagerId} onValueChange={setAllocManagerId}>
                <SelectTrigger><SelectValue placeholder="اختر المسؤول..." /></SelectTrigger>
                <SelectContent>
                  {managers.map(m => (<SelectItem key={m.id} value={m.id.toString()}>{m.name || `مستخدم #${m.id}`}</SelectItem>))}
                  {managers.length === 0 && <SelectItem value="__none" disabled>لا يوجد مديري مشتريات</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>مبلغ العهدة (د.ك) *</Label>
              <Input type="number" step="0.001" value={allocAmount} onChange={e => setAllocAmount(e.target.value)} placeholder="0.000" />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea value={allocNotes} onChange={e => setAllocNotes(e.target.value)} placeholder="الغرض من العهدة..." rows={2} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAllocDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleCreateAlloc} disabled={createAlloc.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {createAlloc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                إنشاء العهدة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Dialog */}
      <Dialog open={showPurchDialog} onOpenChange={setShowPurchDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تسجيل مشتراة</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>العهدة *</Label>
              <Select value={purchAllocId} onValueChange={setPurchAllocId}>
                <SelectTrigger><SelectValue placeholder="اختر العهدة..." /></SelectTrigger>
                <SelectContent>
                  {allocations?.filter(a => a.status === "active").map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.allocationNumber} — متبقي: {parseFloat(a.remainingAmount).toFixed(3)} د.ك
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>اسم المورد *</Label>
              <Input value={purchVendor} onChange={e => setPurchVendor(e.target.value)} placeholder="اسم المحل أو المورد..." />
            </div>
            <div className="space-y-1.5">
              <Label>وصف المشتراة *</Label>
              <Textarea value={purchDesc} onChange={e => setPurchDesc(e.target.value)} placeholder="خشب زان، مسامير، غراء..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (د.ك) *</Label>
              <Input type="number" step="0.001" value={purchAmount} onChange={e => setPurchAmount(e.target.value)} placeholder="0.000" />
            </div>
            <div className="space-y-1.5">
              <Label>صورة الفاتورة الورقية</Label>
              <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-indigo-400/50 transition-colors">
                <Upload className="h-8 w-8 opacity-40" />
                <span className="text-sm">رفع صورة الفاتورة الورقية</span>
                <span className="text-xs">PNG أو JPG حتى 10MB</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea value={purchNotes} onChange={e => setPurchNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." rows={2} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPurchDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleCreatePurchase} disabled={createPurchase.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {createPurchase.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                تسجيل المشتراة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
