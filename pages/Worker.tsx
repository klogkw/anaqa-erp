import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, ClipboardList, Camera, CheckCircle2, Clock,
  Loader2, Calendar, FileText, Upload, AlertCircle, Play
} from "lucide-react";
import { toast } from "sonner";

const taskTypeLabels: Record<string, string> = {
  carpentry: "نجارة", drilling: "حفر", lathe: "خراطة",
  cnc: "CNC", "3d": "طباعة 3D", painting: "صبغ",
  assembly: "تركيب", sanding: "صنفرة", other: "أخرى",
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  assigned: { label: "مسندة", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "قيد التنفيذ", color: "bg-orange-100 text-orange-700 border-orange-200" },
  completed: { label: "مكتملة", color: "bg-green-100 text-green-700 border-green-200" },
  reviewed: { label: "تمت المراجعة", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export default function Worker() {
  const { user } = useAuth();
  const { data: myTasks, isLoading } = trpc.tasks.list.useQuery(
    user?.id ? { workerId: user.id } : undefined
  );
  const utils = trpc.useUtils();

  const updateTask = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => { toast.success("تم تحديث حالة المهمة"); utils.tasks.list.invalidate(); setShowCompleteDialog(false); setCompletionNote(""); },
    onError: (err) => toast.error(err.message),
  });

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [completionNote, setCompletionNote] = useState("");

  const handleStartTask = (taskId: number) => {
    updateTask.mutate({ id: taskId, status: "in_progress" });
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;
    updateTask.mutate({
      id: selectedTask.id,
      status: "completed",
      qualityNotes: completionNote || undefined,
    });
  };

  const counts = {
    assigned: myTasks?.filter(t => t.status === "assigned").length || 0,
    in_progress: myTasks?.filter(t => t.status === "in_progress").length || 0,
    completed: myTasks?.filter(t => t.status === "completed" || t.status === "reviewed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">مهامي</h1>
          <p className="text-sm text-muted-foreground">المهام المسندة إليك في المنجرة</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "مسندة", count: counts.assigned, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      ) : !myTasks || myTasks.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Camera className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد مهام مسندة</p>
            <p className="text-sm mt-1">عند إسناد مهمة لك من الفورمن ستظهر هنا</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myTasks.map(task => {
            const st = taskStatusConfig[task.status || "assigned"] || taskStatusConfig.assigned;
            return (
              <Card key={task.id} className="border border-border/50 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm">{task.taskNumber}</span>
                        <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                        <Badge variant="outline" className="text-xs">{taskTypeLabels[task.taskType] || task.taskType}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleDateString("ar-KW")}
                        </span>
                        {task.expectedCompletionDate && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Clock className="w-3 h-3" />المطلوب: {new Date(task.expectedCompletionDate).toLocaleDateString("ar-KW")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {task.status === "assigned" && (
                        <Button size="sm" className="gap-1 text-xs h-7 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleStartTask(task.id)}>
                          <Play className="w-3 h-3" /> بدء
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button size="sm" className="gap-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedTask(task); setShowCompleteDialog(true); }}>
                          <CheckCircle2 className="w-3 h-3" /> إنجاز
                        </Button>
                      )}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-2">{task.description}</p>
                  )}
                  {task.status === "completed" && task.qualityNotes && (
                    <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{task.qualityNotes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Task Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تأكيد إنجاز المهمة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedTask && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{selectedTask.taskNumber}</p>
                <p className="text-muted-foreground text-xs mt-1">{taskTypeLabels[selectedTask.taskType]}</p>
              </div>
            )}
            <div className="p-4 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
              <Camera className="w-8 h-8 opacity-40" />
              <p className="text-sm">رفع صورة تأكيد الإنجاز</p>
              <p className="text-xs opacity-60">اختياري — يُنصح برفع صورة</p>
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات الإنجاز</Label>
              <Textarea value={completionNote} onChange={e => setCompletionNote(e.target.value)} placeholder="أي ملاحظات عن العمل المنجز..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleCompleteTask} disabled={updateTask.isPending} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2">
                {updateTask.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد الإنجاز
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
