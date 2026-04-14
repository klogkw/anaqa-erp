import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye, Search, Users, ClipboardList, CheckCircle2, Clock,
  BarChart3, Loader2, User, Calendar, TrendingUp, Activity
} from "lucide-react";

const taskTypeLabels: Record<string, string> = {
  carpentry: "نجارة", drilling: "حفر", lathe: "خراطة",
  cnc: "CNC", "3d": "طباعة 3D", painting: "صبغ",
  assembly: "تركيب", sanding: "صنفرة", other: "أخرى",
};

const roleLabels: Record<string, string> = {
  admin: "مدير النظام", seller_shop: "بائع محل", seller_workshop: "بائع منجرة",
  foreman: "فورمن", worker: "عامل", manager_purchases: "مدير مشتريات",
  auditor_purchases: "مدقق مشتريات", accountant_paint: "محاسب صبغ",
  purchases_paint: "مشتريات صبغ", invoices_paint: "فواتير صبغ",
  manager_inventory: "مدير مخزون", accountant: "محاسب", auditor: "مدقق",
  hr: "HR", designer_2d: "مصمم 2D", designer_3d: "مصمم 3D", user: "مستخدم",
};

export default function Auditor() {
  const { data: users, isLoading: loadingUsers } = trpc.users.list.useQuery();
  const { data: tasks, isLoading: loadingTasks } = trpc.tasks.list.useQuery();
  const { data: orders } = trpc.orders.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();

  const [searchUser, setSearchUser] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const filteredUsers = users?.filter(u => {
    const matchSearch = (u.name || "").toLowerCase().includes(searchUser.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const selectedUser = users?.find(u => u.id === selectedUserId);
  const userTasks = tasks?.filter(t => t.workerId === selectedUserId) || [];
  const userOrders = orders?.filter(o => o.createdBy === selectedUserId) || [];

  const stats = {
    totalUsers: users?.length || 0,
    workers: users?.filter(u => u.role === "worker").length || 0,
    activeTasks: tasks?.filter(t => t.status !== "completed" && t.status !== "reviewed").length || 0,
    completedTasks: tasks?.filter(t => t.status === "completed" || t.status === "reviewed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center">
          <Eye className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة المدقق</h1>
          <p className="text-sm text-muted-foreground">عرض إنجازات الموظفين — للمشاهدة فقط</p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الموظفين", value: stats.totalUsers, icon: Users, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "العمال النشطون", value: stats.workers, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "مهام جارية", value: stats.activeTasks, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "مهام مكتملة", value: stats.completedTasks, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map(s => (
          <Card key={s.label} className="border border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users list */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-base font-semibold">الموظفون</h2>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث..." className="pr-10" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger><SelectValue placeholder="الدور" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(roleLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loadingUsers ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : (
            <div className="space-y-2">
              {filteredUsers?.map(u => {
                const uTasks = tasks?.filter(t => t.workerId === u.id) || [];
                const completed = uTasks.filter(t => t.status === "completed" || t.status === "reviewed").length;
                return (
                  <Card key={u.id}
                    className={`border cursor-pointer transition-all ${selectedUserId === u.id ? "border-slate-400 bg-slate-50/50" : "border-border/50 hover:shadow-sm"}`}
                    onClick={() => setSelectedUserId(selectedUserId === u.id ? null : u.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center text-xs font-bold text-slate-600">
                            {(u.name || "م")[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name || `مستخدم #${u.id}`}</p>
                            <p className="text-xs text-muted-foreground">{roleLabels[u.role || "user"] || u.role}</p>
                          </div>
                        </div>
                        {uTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{completed}/{uTasks.length}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* User detail */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <Card className="border-dashed border-2 h-full">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
                <Eye className="h-12 w-12 mb-3 opacity-20" />
                <p className="text-base font-medium">اختر موظفاً للعرض</p>
                <p className="text-sm mt-1">اضغط على أي موظف لعرض مهامه وإنجازاته</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center text-lg font-bold text-slate-600">
                      {(selectedUser.name || "م")[0]}
                    </div>
                    <div>
                      <p className="font-bold">{selectedUser.name || `مستخدم #${selectedUser.id}`}</p>
                      <p className="text-sm text-muted-foreground">{roleLabels[selectedUser.role || "user"]}</p>
                      {selectedUser.email && <p className="text-xs text-muted-foreground">{selectedUser.email}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: "مجموع المهام", value: userTasks.length },
                      { label: "مكتملة", value: userTasks.filter(t => t.status === "completed" || t.status === "reviewed").length },
                      { label: "الطلبيات", value: userOrders.length },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 rounded-lg bg-muted/40">
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {userTasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">المهام</h3>
                  <div className="space-y-2">
                    {userTasks.slice(0, 10).map(task => (
                      <Card key={task.id} className="border border-border/50">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">{task.taskNumber}</span>
                            <span className="text-xs text-muted-foreground mr-2">{taskTypeLabels[task.taskType]}</span>
                          </div>
                          <Badge className={`text-xs border ${
                            task.status === "completed" || task.status === "reviewed"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : task.status === "in_progress"
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}>
                            {task.status === "completed" || task.status === "reviewed" ? "مكتملة" :
                             task.status === "in_progress" ? "قيد التنفيذ" : "مسندة"}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
