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
import { Package, Search, Plus, Loader2, Tag, DollarSign, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  const { data: productsList, isLoading } = trpc.products.list.useQuery();
  const { data: categoriesList } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("تم إضافة المنتج بنجاح"); setShowCreate(false); resetForm(); utils.products.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("تم إضافة الفئة"); setCategoryName(""); utils.categories.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("تم التحديث"); utils.products.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [unit, setUnit] = useState("piece");

  const resetForm = () => { setName(""); setCode(""); setCategoryId(""); setDescription(""); setBasePrice(""); setUnit("piece"); };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("أدخل اسم المنتج"); return; }
    if (!code.trim()) { toast.error("أدخل رمز المنتج"); return; }
    if (!basePrice || parseFloat(basePrice) < 0) { toast.error("أدخل سعر صحيح"); return; }
    createProduct.mutate({
      name, code, description: description || undefined,
      basePrice: parseFloat(basePrice).toFixed(3),
      unit: unit || "piece",
      categoryId: categoryId ? parseInt(categoryId) : undefined,
    });
  };

  const toggleActive = (id: number, isActive: boolean) => {
    updateProduct.mutate({ id, isActive: !isActive });
  };

  const filtered = productsList?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = productsList?.filter(p => p.isActive).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
            <p className="text-sm text-muted-foreground">{activeCount} منتج نشط من أصل {productsList?.length || 0}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowAddCategory(true)}>
            <Tag className="h-4 w-4" /> فئة جديدة
          </Button>
          <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> إضافة منتج
          </Button>
        </div>
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الرمز..." className="pr-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد منتجات</p>
            <p className="text-sm mt-1">أضف منتجات لتظهر في قوائم الفواتير</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => {
            const cat = categoriesList?.find(c => c.id === p.categoryId);
            return (
              <Card key={p.id} className={`border shadow-sm transition-all ${p.isActive ? "border-border/50 hover:shadow-md" : "border-border/30 opacity-60"}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                    </div>
                    <button onClick={() => toggleActive(p.id, p.isActive ?? true)} className="shrink-0 mt-0.5">
                      {p.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                      }
                    </button>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-sm font-bold text-violet-700">
                      <DollarSign className="w-3.5 h-3.5" />
                      {parseFloat(p.basePrice).toFixed(3)} د.ك
                    </div>
                    <div className="flex gap-1">
                      {cat && <Badge variant="outline" className="text-xs">{cat.name}</Badge>}
                      <Badge variant="outline" className="text-xs">{p.unit || "قطعة"}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Product Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إضافة منتج جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>اسم المنتج *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="كرسي ديوانية..." />
              </div>
              <div className="space-y-1.5">
                <Label>الرمز *</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="CHR-001" className="font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الفئة</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="اختر الفئة..." /></SelectTrigger>
                <SelectContent>
                  {categoriesList?.map(c => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}
                  {(!categoriesList || categoriesList.length === 0) && (
                    <SelectItem value="__none" disabled>لا توجد فئات — أضف فئة أولاً</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف مختصر للمنتج..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>السعر الأساسي (د.ك) *</Label>
                <Input type="number" step="0.001" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.000" />
              </div>
              <div className="space-y-1.5">
                <Label>الوحدة</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">قطعة</SelectItem>
                    <SelectItem value="meter">متر</SelectItem>
                    <SelectItem value="sqmeter">م²</SelectItem>
                    <SelectItem value="set">طقم</SelectItem>
                    <SelectItem value="kg">كيلو</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleCreate} disabled={createProduct.isPending} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-2">
                {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إضافة المنتج
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader><DialogTitle className="text-right">إضافة فئة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>اسم الفئة *</Label>
              <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="موبيليا، خزائن، ديوانيات..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddCategory(false)} className="flex-1">إلغاء</Button>
              <Button onClick={() => { if (!categoryName.trim()) return; createCategory.mutate({ name: categoryName }); setShowAddCategory(false); }}
                disabled={createCategory.isPending} className="flex-1 gap-2">
                {createCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إضافة الفئة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
