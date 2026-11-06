import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createAdminPromoCode,
  fetchAdminPromoCodes,
  setAdminPromoCodeActive,
  type AdminPromoCode,
} from "@/api/promoCodes";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const AdminPromoCodesPage = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthCheck();
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminPromoCodes()
      .then((codes) => {
        if (!cancelled) setPromoCodes(codes);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load promo codes");
      })
      .finally(() => {
        if (!cancelled) setLoadingCodes(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    setCreating(true);
    try {
      const created = await createAdminPromoCode({ code: normalized, description: description.trim() || undefined });
      setPromoCodes((current) => [created, ...current]);
      setCode("");
      setDescription("");
      toast.success(`Promo code ${created.code} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create promo code");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (promo: AdminPromoCode) => {
    setUpdatingId(promo.promoCodeId);
    try {
      const updated = await setAdminPromoCodeActive(promo.promoCodeId, !promo.isActive);
      setPromoCodes((current) => current.map((item) => (item.promoCodeId === updated.promoCodeId ? updated : item)));
      toast.success(`${updated.code} ${updated.isActive ? "reactivated" : "deactivated"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update promo code");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const activeCount = promoCodes.filter((promo) => promo.isActive).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
          onClick={() => navigate("/dashboard/admin/profile")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Button>

        <div>
          <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">
            Active codes give new partners a 6-month free trial on a paid plan. Trials do not renew automatically.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-barlow font-bold text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Add promo code
            </CardTitle>
            <CardDescription>Codes are case-insensitive and saved in uppercase.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="e.g. CHAMBER2026"
                  pattern="[A-Za-z0-9_\-]{3,50}"
                  title="3-50 letters, numbers, dashes, or underscores"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-description">Description (optional)</Label>
                <Input
                  id="promo-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Who this code is for"
                  maxLength={255}
                />
              </div>
              <Button type="submit" disabled={creating || !code.trim()} className="bg-royal hover:bg-royal-dark text-white">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add code
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-barlow font-bold text-base flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" /> All promo codes
            </CardTitle>
            <CardDescription>
              {loadingCodes ? "Loading..." : `${activeCount} active of ${promoCodes.length}`}. Deactivating a code stops new
              sign-ups from using it; trials already granted keep running until they end.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCodes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading promo codes...
              </div>
            ) : promoCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">No promo codes yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Redemptions</TableHead>
                      <TableHead className="text-right">Trials running</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map((promo) => (
                      <TableRow key={promo.promoCodeId}>
                        <TableCell className="font-mono font-semibold">{promo.code}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                          {promo.description || "—"}
                        </TableCell>
                        <TableCell>
                          {promo.isActive ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600">
                              Inactive since {formatDate(promo.deactivatedAt)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{promo.redemptionCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{promo.activeTrialCount}</TableCell>
                        <TableCell className="text-sm">{formatDate(promo.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === promo.promoCodeId}
                            className={promo.isActive ? "text-destructive hover:text-destructive" : ""}
                            onClick={() => void handleToggle(promo)}
                          >
                            {updatingId === promo.promoCodeId && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            {promo.isActive ? "Deactivate" : "Reactivate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPromoCodesPage;
