import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart, Plus, Trash2, Receipt, FileText, User,
  Package, Calculator, Loader2, Check, Building2
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  id: string;
  productId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description: string;
  customDetails?: string;
  isCustom: boolean;
}

export default function POS() {
  const { data: productsList } = trpc.products.list.useQuery();
  const { data: branchesList } = trpc.branches.list.useQuery();
  const utils = trpc.useUtils();
  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء الفاتورة بنجاح - رقم: ${data.invoiceNumber}`);
      resetForm();
      utils.invoices.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [invoiceType, setInvoiceType] = useState<"standard" | "custom">("standard");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const addProductItem = () => {
    if (!selectedProductId) return;
    const product = productsList?.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;
    const price = parseFloat(product.basePrice);
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
      description: product.description || "",
      isCustom: false,
    }]);
    setSelectedProductId("");
  };

  const addCustomItem = () => {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      productName: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      description: "",
      customDetails: "",
      isCustom: true,
    }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated.totalPrice = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);

  const resetForm = () => {
    setCustomerName(""); setCustomerPhone(""); setNotes(""); setItems([]); setInvoiceType("standard"); setBranchId("");
  };

  const handleSubmit = () => {
    if (!customerName.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
    if (!branchId) { toast.error("يرجى اختيار الفرع"); return; }
    if (items.length === 0) { toast.error("يرجى إضافة منتج واحد على الأقل"); return; }
    for (const item of items) {
      if (!item.productName.trim()) { toast.error("يرجى إدخال اسم المنتج لجميع الأصناف"); return; }
      if (item.unitPrice <= 0) { toast.error("يرجى إدخال سعر صحيح لجميع الأصناف"); return; }
    }
    createInvoice.mutate({
      customerName,
      customerPhone: customerPhone || undefined,
      branchId: parseInt(branchId),
      invoiceType,
      totalAmount: totalAmount.toFixed(2),
      notes: notes || undefined,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
        description: item.description || undefined,
        customDetails: item.customDetails || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">نقطة البيع</h1>
            <p className="text-sm text-muted-foreground">إنشاء فاتورة جديدة</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={invoiceType === "standard" ? "default" : "outline"} onClick={() => setInvoiceType("standard")} className="gap-2">
            <Receipt className="h-4 w-4" /> فاتورة عادية
          </Button>
          <Button variant={invoiceType === "custom" ? "default" : "outline"} onClick={() => setInvoiceType("custom")} className="gap-2">
            <FileText className="h-4 w-4" /> فاتورة تفصيلية
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Product */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" /> إضافة منتج
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر منتج من القائمة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productsList?.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} - {parseFloat(p.basePrice).toFixed(2)} د.ك
                      </SelectItem>
                    ))}
                    {(!productsList || productsList.filter(p => p.isActive).length === 0) && (
                      <SelectItem value="__none" disabled>لا توجد منتجات - أضف من صفحة المنتجات</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={addProductItem} disabled={!selectedProductId}>
                  <Plus className="w-4 h-4 ml-1" /> إضافة
                </Button>
              </div>
              <Button variant="outline" onClick={addCustomItem} className="w-full gap-1">
                <Plus className="h-4 w-4" />
                {invoiceType === "custom" ? "إضافة منتج تفصيلي (غير موجود بالقائمة)" : "إضافة منتج يدوياً"}
              </Button>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> المنتجات
                <Badge variant="secondary" className="mr-2">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">لم يتم إضافة أي منتج بعد</p>
                  <p className="text-xs mt-1">اختر منتج من القائمة أو أضف منتج يدوياً</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        منتج #{index + 1}
                        {item.isCustom && <Badge variant="outline" className="mr-2 text-xs">تفصيلي</Badge>}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">اسم المنتج</Label>
                        <Input value={item.productName} onChange={(e) => updateItem(item.id, "productName", e.target.value)} readOnly={!item.isCustom} className={!item.isCustom ? "bg-muted/50" : ""} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">الكمية</Label>
                        <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">سعر الوحدة (د.ك)</Label>
                        <Input type="number" min={0} step={0.5} value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    {(invoiceType === "custom" || item.isCustom) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">تفاصيل تفصيلية</Label>
                        <Textarea placeholder="أدخل التفاصيل الخاصة بهذا المنتج (المقاسات، الخامة، اللون...)" value={item.customDetails || ""} onChange={(e) => updateItem(item.id, "customDetails", e.target.value)} rows={2} />
                      </div>
                    )}
                    <div className="flex justify-end">
                      <span className="text-sm font-semibold">
                        الإجمالي: <span className="text-primary">{item.totalPrice.toFixed(2)} د.ك</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Customer & Summary */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4" /> بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">اسم العميل *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسم العميل" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">رقم الهاتف</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="رقم هاتف العميل" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الفرع *</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفرع..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branchesList?.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" /> {b.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50 sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4" /> ملخص الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">نوع الفاتورة</span>
                  <Badge variant={invoiceType === "standard" ? "default" : "secondary"}>
                    {invoiceType === "standard" ? "عادية" : "تفصيلية"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">عدد المنتجات</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary">{totalAmount.toFixed(2)} د.ك</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ملاحظات</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات إضافية..." rows={2} />
              </div>
              <Button onClick={handleSubmit} disabled={createInvoice.isPending || items.length === 0} className="w-full gap-2 bg-gradient-to-l from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white" size="lg">
                {createInvoice.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                إنشاء الفاتورة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
