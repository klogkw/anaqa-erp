import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Warehouse, Search, Loader2, Package, AlertTriangle, Building2 } from "lucide-react";
import { useState } from "react";

export default function Inventory() {
  const { data: inventoryList, isLoading } = trpc.inventory.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: branches } = trpc.branches.list.useQuery();
  const [search, setSearch] = useState("");

  const enriched = inventoryList?.map(inv => ({
    ...inv,
    product: products?.find(p => p.id === inv.productId),
    branch: branches?.find(b => b.id === inv.branchId),
  })) || [];

  const filtered = enriched.filter(inv => {
    const pName = inv.product?.name || "";
    const bName = inv.branch?.name || "";
    return pName.toLowerCase().includes(search.toLowerCase()) || bName.toLowerCase().includes(search.toLowerCase());
  });

  const lowStock = enriched.filter(i => (i.quantity || 0) <= (i.minimumLevel || 0) && (i.minimumLevel || 0) > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center">
          <Warehouse className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">المخزون</h1>
          <p className="text-sm text-muted-foreground">متابعة مستويات المخزون في جميع الفروع</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-700 font-medium">
              {lowStock.length} صنف وصل للحد الأدنى من المخزون
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالمنتج أو الفرع..." className="pr-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Warehouse className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد بيانات مخزون</p>
            <p className="text-sm mt-1">ستُحدَّث البيانات تلقائياً عند إجراء عمليات المخزون</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(inv => {
            const isLow = (inv.quantity || 0) <= (inv.minimumLevel || 0) && (inv.minimumLevel || 0) > 0;
            return (
              <Card key={inv.id} className={`border shadow-sm ${isLow ? "border-orange-200" : "border-border/50"}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{inv.product?.name || `منتج #${inv.productId}`}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        {inv.branch?.name || `فرع #${inv.branchId}`}
                      </p>
                    </div>
                    {isLow && <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{inv.quantity || 0}</span>
                    <Badge variant={isLow ? "destructive" : "secondary"} className="text-xs">
                      {isLow ? "مخزون منخفض" : "متوفر"}
                    </Badge>
                  </div>
                  {(inv.minimumLevel || 0) > 0 && (
                    <p className="text-xs text-muted-foreground">الحد الأدنى: {inv.minimumLevel}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
