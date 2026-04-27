"use client";

import { useState } from "react";
import { Package, Plus, AlertTriangle, Search, Pill, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { SlidePanel } from "@/components/ui/slide-panel";
import { LoadingSpinner } from "@/components/ui/loading";
import { useModuleAccess } from "@/modules/core/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function useProducts(params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery({ queryKey: ["products", params], queryFn: () => fetch(`/api/products${qs}`).then((r) => r.json()) });
}

export default function PharmacyPage() {
  const access = useModuleAccess("MOD-BILLING");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "OTHER", brand: "", sellPrice: "", costPrice: "", quantity: "", reorderLevel: "5", unit: "" });

  const { data: res, isLoading } = useProducts({ ...(search && { search }), ...(categoryFilter && { category: categoryFilter }) });
  const products = ((res?.data || []) as Record<string, unknown>[]);
  const stats = (res?.stats || {}) as Record<string, number>;

  const createProduct = useMutation({
    mutationFn: (data: Record<string, unknown>) => fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setShowAdd(false); setForm({ name: "", sku: "", category: "OTHER", brand: "", sellPrice: "", costPrice: "", quantity: "", reorderLevel: "5", unit: "" }); },
  });

  if (!access.canView) return <div className="flex items-center justify-center py-20 text-stone-500">No access.</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dental Supplies & Materials</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage dental materials, consumables, and stock</p>
        </div>
        <Button size="sm" iconLeft={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAdd(true)}>Add Item</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatBox label="Total Products" value={stats.total || 0} icon={<Package className="w-5 h-5" />} color="text-blue-600" bg="bg-blue-50" />
        <StatBox label="Low Stock" value={stats.lowStock || 0} icon={<TrendingDown className="w-5 h-5" />} color="text-amber-600" bg="bg-amber-50" />
        <StatBox label="Out of Stock" value={stats.outOfStock || 0} icon={<AlertTriangle className="w-5 h-5" />} color="text-red-600" bg="bg-red-50" />
        <StatBox label="Stock Value" value={formatCurrency(stats.totalValue || 0)} icon={<Pill className="w-5 h-5" />} color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchInput placeholder="Search products..." value={search} onChange={setSearch} debounceMs={300} />
        </div>
        <Select placeholder="All Categories" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          options={[{ value: "", label: "All" }, { value: "CLEANSER", label: "Restorative Material" }, { value: "MOISTURIZER", label: "Endodontic" }, { value: "SUNSCREEN", label: "Impression / Crown" }, { value: "SERUM", label: "Anesthetic" }, { value: "TREATMENT", label: "Periodontic / Hygiene" }, { value: "SUPPLEMENT", label: "Medication" }, { value: "TOOL", label: "Instrument" }, { value: "OTHER", label: "Other" }]} />
      </div>

      {/* Product Grid */}
      {isLoading ? <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" /></div> :
        products.length === 0 ? <div className="text-center py-12 text-sm text-stone-400">No products found</div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p) => {
            const qty = Number(p.quantity || 0);
            const reorder = Number(p.reorderLevel || 5);
            const isLow = qty > 0 && qty <= reorder;
            const isOut = qty === 0;
            return (
              <Card key={String(p.id)} className={cn(isOut && "border-red-200", isLow && "border-amber-200")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{String(p.name)}</p>
                      <p className="text-[10px] text-stone-400">{String(p.sku || "")} {p.brand ? `· ${p.brand}` : ""}</p>
                    </div>
                    <Badge variant={isOut ? "danger" : isLow ? "warning" : "success"} className="text-[9px]">
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-stone-50 rounded-lg p-2"><p className="text-xs text-stone-400">Price</p><p className="text-sm font-bold text-stone-900">{formatCurrency(Number(p.sellPrice || 0))}</p></div>
                    <div className={cn("rounded-lg p-2", isOut ? "bg-red-50" : isLow ? "bg-amber-50" : "bg-stone-50")}><p className="text-xs text-stone-400">Stock</p><p className={cn("text-sm font-bold", isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-stone-900")}>{qty}</p></div>
                    <div className="bg-stone-50 rounded-lg p-2"><p className="text-xs text-stone-400">Reorder</p><p className="text-sm font-bold text-stone-900">{reorder}</p></div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2">{String(p.category || "").replace("_", " ")} {p.unit ? `· ${p.unit}` : ""}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      }

      {/* Add Product Panel */}
      <SlidePanel isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Dental Item" subtitle="Add to dental supplies inventory" width="md"
        footer={<><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={() => createProduct.mutate({ ...form, sellPrice: parseFloat(form.sellPrice) || 0, costPrice: parseFloat(form.costPrice) || 0, quantity: parseInt(form.quantity) || 0, reorderLevel: parseInt(form.reorderLevel) || 5, branchId: user?.branchId })} disabled={!form.name.trim() || createProduct.isPending}>{createProduct.isPending ? "Adding..." : "Add Product"}</Button></>}>
        <div className="space-y-3">
          <Input label="Item Name" required placeholder="e.g. Composite Resin A2, Lidocaine 2%" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" placeholder="Optional" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            <Input label="Brand" placeholder="Optional" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          </div>
          <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={[{ value: "CLEANSER", label: "Cleanser" }, { value: "MOISTURIZER", label: "Moisturizer" }, { value: "SUNSCREEN", label: "Sunscreen" }, { value: "SERUM", label: "Serum" }, { value: "TREATMENT", label: "Treatment" }, { value: "SUPPLEMENT", label: "Supplement" }, { value: "TOOL", label: "Tool" }, { value: "OTHER", label: "Other" }]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sell Price (PKR)" type="number" value={form.sellPrice} onChange={(e) => setForm((f) => ({ ...f, sellPrice: e.target.value }))} />
            <Input label="Cost Price (PKR)" type="number" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
            <Input label="Unit" placeholder="e.g. ml, tube" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

function StatBox({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] border border-stone-100 shadow-[var(--shadow-surface-1)] p-3.5 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>{icon}</div>
      <div><p className="text-lg font-bold text-stone-900">{value}</p><p className="text-[10px] text-stone-400">{label}</p></div>
    </div>
  );
}
