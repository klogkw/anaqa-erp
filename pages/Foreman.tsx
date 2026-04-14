import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  HardHat, Search, Filter, ClipboardList, Clock, CheckCircle2,
  AlertCircle, Plus, User, Calendar, ChevronDown, ChevronUp,
  Loader2, Building2, FileText, Hammer, Settings2
} from "lucide-react";
import { toast } from "sonner";

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "جديدة", color: "bg-blue-100 text-blue-700 border-blue-200" },
  assigned: { label: "موزعة", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  in_progress: { label: "قيد التنفيذ", color: "bg-orange-100 text-orange-700 border-orange-200" },
  completed: { label: "مكتملة", color: "bg-green-100 text-green-700 border-green-200" },
  delivered: { label: "تم التسليم", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const taskTypeLabels: Record<string, string> = {
  carpentry: "نجارة",
  drilling: "حفر",
  lathe: "خراطة",
  cnc: "CNC",
  "3d": "طباعة 3D",
  painting: "صبغ",
  assembly: "تركيب",
  sanding: "صنفرة",
  other: "أخرى",
};

export default function Foreman() {
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const { data: workers } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const updateOrderStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("تم تحديث حالة الطلبية"); utils.orders.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("تم إسناد المهمة بنجاح");
      setShowAssignDialog(false);
      resetTaskForm();
      utils.tasks.list.invalidate();
      utils.orders.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [taskType, setTaskType] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskExpectedDate, setTaskExpectedDate] = useState("");

  const resetTaskForm = () => {
    setTaskType(""); setWorkerId(""); setTaskDesc(""); setTaskExpectedDate("");
  };

  const workerList = workers?.filter(w => w.role === "worker") || [];

  const filtered = orders?.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    new: orders?.filter(o => o.status === "new").length || 0,
    in_progress: orders?.filter(o => o.status === "in_progress" || o.status === "assigned").length || 0,
    completed: orders?.filter(o => o.status === "completed" || o.status === "delivered").length || 0,
  };

  const handleAssignTask = () => {
    if (!selectedOrder) return;
    if (!taskType) { toast.error("اختر نوع المهمة"); return; }
    if (!workerId) { toast.error("اختر العامل"); return; }
    createTask.mutate({
      orderId: selectedOrder.id,
      workerId: parseInt(workerId),
      taskType: taskType as any,
      description: taskDesc || undefined,
      expectedCompletionDate: taskExpectedDate || undefined,
    });
    // also update order to assigned
    updateOrderStatus.mutate({ id: selectedOrder.id, status: "assigned" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة الفورمن</h1>
            <p className="text-sm text-muted-foreground">استقبال الطلبيات وتوزيعها على أقسام المنجرة</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "طلبيات جديدة", count: counts.new, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "قيد التنفيذ", count: counts.in_progress, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "مكتملة", count: counts.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
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
                <SelectItem value="new">جديدة</SelectItem>
                <SelectItem value="assigned">موزعة</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد طلبيات واردة</p>
            <p className="text-sm mt-1">ستظهر هنا الطلبيات الجديدة من جميع الأفرع</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const st = orderStatusConfig[order.status || "new"] || orderStatusConfig.new;
            const isExpanded = expandedId === order.id;
            return (
              <Card key={order.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <Hammer className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">{order.orderNumber}</span>
                          <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customerName}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(order.createdAt).toLocaleDateString("ar-KW")}</span>
                          {order.expectedCompletionDate && (
                            <span className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-3 h-3" />التسليم: {new Date(order.expectedCompletionDate).toLocaleDateString("ar-KW")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {order.status === "new" && (
                        <Button size="sm" className="gap-1 text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { setSelectedOrder(order); setShowAssignDialog(true); }}>
                          <Plus className="w-3 h-3" /> إسناد مهمة
                        </Button>
                      )}
                      {order.status === "assigned" && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => updateOrderStatus.mutate({ id: order.id, status: "in_progress" })}>
                          بدء التنفيذ
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.description && (
                    <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-2 line-clamp-2">{order.description}</p>
                  )}

                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? "إخفاء" : "تفاصيل إضافية"}
                  </Button>

                  {isExpanded && order.additionalDetails && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">{order.additionalDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Task Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">إسناد مهمة — {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedOrder && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{selectedOrder.customerName}</p>
                {selectedOrder.description && <p className="text-muted-foreground mt-1 text-xs">{selectedOrder.description}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>نوع المهمة *</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger><SelectValue placeholder="اختر نوع المهمة..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(taskTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>تعيين العامل *</Label>
              <Select value={workerId} onValueChange={setWorkerId}>
                <SelectTrigger><SelectValue placeholder="اختر العامل..." /></SelectTrigger>
                <SelectContent>
                  {workerList.map(w => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.name || `عامل #${w.id}`}</SelectItem>
                  ))}
                  {workerList.length === 0 && (
                    <SelectItem value="__none" disabled>لا يوجد عمال — أضف من إدارة الموظفين</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>وصف المهمة</Label>
              <Textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="تفاصيل المهمة للعامل..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>التاريخ المتوقع للإنجاز</Label>
              <Input type="date" value={taskExpectedDate} onChange={e => setTaskExpectedDate(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleAssignTask} disabled={createTask.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2">
                {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إسناد المهمة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
