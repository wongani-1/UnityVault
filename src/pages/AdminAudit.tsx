import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const fallbackLogs = [
  {
    actor: "Sarah Banda",
    action: "member_approved",
    entity: "Member: Grace Atim",
    time: "2026-02-06 09:42",
  },
  {
    actor: "Sarah Banda",
    action: "loan_approved",
    entity: "Loan: Robert Ochieng",
    time: "2026-02-05 14:18",
  },
  {
    actor: "System",
    action: "penalty_applied",
    entity: "Loan: David Mukiibi",
    time: "2026-02-04 07:05",
  },
];

type AuditLogItem = {
  actor: string;
  action: string;
  entity: string;
  time: string;
};

type LedgerType =
  | "contribution"
  | "loan_disbursement"
  | "loan_repayment"
  | "penalty_charged"
  | "penalty_payment"
  | "cycle_distribution"
  | "initial_deposit";

type LedgerEntry = {
  id: string;
  memberId: string;
  type: LedgerType;
  amount: number;
  description: string;
  memberSavingsChange: number;
  groupIncomeChange: number;
  groupCashChange: number;
  createdAt: string;
  createdBy: string;
};

type Member = {
  id: string;
  first_name: string;
  last_name: string;
};

const LEDGER_TYPES: LedgerType[] = [
  "contribution",
  "loan_disbursement",
  "loan_repayment",
  "penalty_charged",
  "penalty_payment",
  "cycle_distribution",
  "initial_deposit",
];

const formatTypeLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatCurrency = (value: number) => `MWK ${value.toLocaleString()}`;

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
};

const csvEscape = (value: string | number) => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const AdminAudit = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>(fallbackLogs);
  const [members, setMembers] = useState<Member[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [filters, setFilters] = useState({
    memberId: "",
    type: "",
    from: "",
    to: "",
    limit: "100",
  });

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => {
      map.set(member.id, `${member.first_name} ${member.last_name}`.trim());
    });
    return map;
  }, [members]);

  const summary = useMemo(() => {
    return entries.reduce(
      (acc, item) => {
        acc.totalAmount += item.amount;
        acc.cashChange += item.groupCashChange;
        acc.incomeChange += item.groupIncomeChange;
        acc.savingsChange += item.memberSavingsChange;
        return acc;
      },
      { totalAmount: 0, cashChange: 0, incomeChange: 0, savingsChange: 0 }
    );
  }, [entries]);

  const loadLedger = async (nextFilters = filters) => {
    setLoadingLedger(true);
    try {
      const params = new URLSearchParams();
      if (nextFilters.memberId) params.set("memberId", nextFilters.memberId);
      if (nextFilters.type) params.set("type", nextFilters.type);
      if (nextFilters.from) params.set("from", nextFilters.from);
      if (nextFilters.to) params.set("to", nextFilters.to);
      if (nextFilters.limit) params.set("limit", nextFilters.limit);

      const query = params.toString();
      const data = await apiRequest<{ items: LedgerEntry[] }>(
        `/ledger${query ? `?${query}` : ""}`
      );
      setEntries(data.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load ledger entries";
      toast.error(message);
    } finally {
      setLoadingLedger(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await apiRequest<{
        items: Array<{
          id: string;
          actorId: string;
          actorRole: string;
          action: string;
          entityType: string;
          entityId: string;
          createdAt: string;
        }>;
      }>("/audit");

      const mapped = data.items.map((item) => ({
        actor: `${item.actorRole} ${item.actorId}`,
        action: item.action,
        entity: `${item.entityType}: ${item.entityId}`,
        time: item.createdAt.slice(0, 16).replace("T", " "),
      }));
      setLogs(mapped.length ? mapped : fallbackLogs);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load audit logs";
      toast.error(message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await apiRequest<{ items: Member[] }>("/members");
      setMembers(data.items);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    loadMembers();
    loadLedger();
    loadAuditLogs();
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = async () => {
    await loadLedger(filters);
  };

  const handleResetFilters = async () => {
    const resetFilters = {
      memberId: "",
      type: "",
      from: "",
      to: "",
      limit: "100",
    };
    setFilters(resetFilters);
    await loadLedger(resetFilters);
  };

  const handleExportCsv = () => {
    if (!entries.length) {
      toast.error("No ledger entries available to export");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Member",
      "Description",
      "Amount",
      "CashChange",
      "SavingsChange",
      "IncomeChange",
      "CreatedBy",
    ];

    const rows = entries.map((item) => [
      formatDateTime(item.createdAt),
      formatTypeLabel(item.type),
      memberNameById.get(item.memberId) || item.memberId,
      item.description,
      item.amount,
      item.groupCashChange,
      item.memberSavingsChange,
      item.groupIncomeChange,
      item.createdBy,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((col) => csvEscape(col)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledger_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Ledger exported for audit");
  };

  return (
    <DashboardLayout title="Audit Logs" subtitle="Review activity and financial ledger" isAdmin>
      <div className="space-y-6">
        <Card className="border-0 shadow-card">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Financial Ledger
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="memberFilter">Member</Label>
                <select
                  id="memberFilter"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.memberId}
                  onChange={(e) => handleFilterChange("memberId", e.target.value)}
                >
                  <option value="">All Members</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {`${member.first_name} ${member.last_name}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeFilter">Transaction Type</Label>
                <select
                  id="typeFilter"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                >
                  <option value="">All Types</option>
                  {LEDGER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromFilter">From</Label>
                <Input
                  id="fromFilter"
                  type="date"
                  value={filters.from}
                  onChange={(e) => handleFilterChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toFilter">To</Label>
                <Input
                  id="toFilter"
                  type="date"
                  value={filters.to}
                  onChange={(e) => handleFilterChange("to", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limitFilter">Limit</Label>
                <Input
                  id="limitFilter"
                  type="number"
                  min="1"
                  max="500"
                  value={filters.limit}
                  onChange={(e) => handleFilterChange("limit", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button variant="hero" size="sm" onClick={handleApplyFilters} disabled={loadingLedger}>
                {loadingLedger ? "Loading..." : "Apply Filters"}
              </Button>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Rows</p>
                <p className="text-lg font-semibold text-foreground">{entries.length}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Cash Change</p>
                <p className={`text-lg font-semibold ${summary.cashChange >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(summary.cashChange)}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Income Change</p>
                <p className={`text-lg font-semibold ${summary.incomeChange >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(summary.incomeChange)}
                </p>
              </div>
            </div>

            {loadingLedger && <p className="text-sm text-muted-foreground">Loading ledger entries...</p>}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Cash Δ</TableHead>
                  <TableHead className="text-right">Savings Δ</TableHead>
                  <TableHead className="text-right">Income Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                        {formatTypeLabel(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{memberNameById.get(item.memberId) || item.memberId}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{item.description}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className={`text-right ${item.groupCashChange >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(item.groupCashChange)}
                    </TableCell>
                    <TableCell className={`text-right ${item.memberSavingsChange >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(item.memberSavingsChange)}
                    </TableCell>
                    <TableCell className={`text-right ${item.groupIncomeChange >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(item.groupIncomeChange)}
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingLedger && entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No ledger entries found for these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Action Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingLogs && <p className="text-sm text-muted-foreground">Loading audit logs...</p>}
            {logs.map((log) => (
              <div
                key={`${log.action}-${log.time}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{log.entity}</p>
                  <p className="text-xs text-muted-foreground">{log.actor}</p>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  {log.action}
                </Badge>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAudit;
