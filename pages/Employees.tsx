import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, User, Loader2, Settings2, Calendar } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام", seller_shop: "بائع محل", seller_workshop: "بائع منجرة",
  foreman: "فورمن", worker: "عامل", manager_purchases: "مدير مشتريات",
  auditor_purchases: "مدقق مشتريات", accountant_paint: "محاسب صبغ",
  purchases_paint: "مشتريات صبغ", invoices_paint: "فواتير صبغ",
  manager_inventory: "مدير مخزون", accountant: "محاسب", auditor: "مدقق",
  hr: "HR", designer_2d: "مصمم 2D", designer_3d: "مصمم 3D", user: "مستخدم",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700", foreman: "bg-amber-100 text-amber-700",
  worker: "bg-blue-100 text-blue-700", seller_shop: "bg-green-100 text-green-700",
  seller_workshop: "bg-teal-100 text-teal-700", accountant: "bg-purple-100 text-purple-700",
  auditor: "bg-slate-100 text-slate-700",
};

export default function Employees() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("تم تحديث الدور بنجاح"); setShowRoleDialog(false); utils.users.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");

  const filtered = users?.filter(u => {
    const matchSearch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openRoleDialog = (u: any) => {
    setSelectedUser(u);
    setNewRole(u.role || "user");
    setShowRoleDialog(true);
  };

  const handleUpdateRole = () => {
    if (!selectedUser || !newRole) return;
    updateRole.mutate({ userId: selectedUser.id, role: newRole });
  };

  const roleCounts: Record<string, number> = {};
  users?.forEach(u => { roleCounts[u.role || "user"] = (roleCounts[u.role || "user"] || 0) + 1; });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">الموظفين</h1>
          <p className="text-sm text-muted-foreground">إدارة أدوار وصلاحيات الفريق</p>
        </div>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(roleCounts).map(([role, count]) => (
          <Badge key={role} variant="outline" className="gap-1">
            {roleLabels[role] || role}
            <span className="font-bold">{count}</span>
          </Badge>
        ))}
      </div>

      {/* Search */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث بالاسم أو الإيميل..." className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="الدور" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(roleLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered?.map(u => (
            <Card key={u.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center font-bold text-teal-700 text-sm shrink-0">
                      {(u.name || "م")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.name || `مستخدم #${u.id}`}</p>
                      {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                      <Badge className={`mt-1 text-xs ${roleColors[u.role || "user"] || "bg-gray-100 text-gray-600"}`}>
                        {roleLabels[u.role || "user"] || u.role}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openRoleDialog(u)}>
                    <Settings2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  انضم: {new Date(u.createdAt).toLocaleDateString("ar-KW")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">تغيير الدور</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700">
                  {(selectedUser.name || "م")[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedUser.name || `مستخدم #${selectedUser.id}`}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>الدور الجديد</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="flex-1">إلغاء</Button>
                <Button onClick={handleUpdateRole} disabled={updateRole.isPending} className="flex-1 gap-2">
                  {updateRole.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
