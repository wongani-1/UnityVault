import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "../lib/api";
import { toast } from "@/components/ui/sonner";

const MemberContributions = () => {
  const [items, setItems] = useState<Array<{date: string; amount: string; status: string; method: string}>>([]);
  const [loading, setLoading] = useState(true);

  const formatPaymentMethod = (method?: "airtel_money" | "tnm_mpamba" | "card") => {
    if (method === "airtel_money") return "Airtel Money";
    if (method === "tnm_mpamba") return "TNM Mpamba";
    if (method === "card") return "Card Payment";
    return "-";
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiRequest<{ items: Array<{
          id: string;
          amount: number;
          month: string;
          paidAt?: string;
          createdAt: string;
          paymentMethod?: "airtel_money" | "tnm_mpamba" | "card";
        }> }>("/contributions");

        if (!active) return;
        const mapped = data.items.map((item) => ({
          date: (item.paidAt || item.createdAt).slice(0, 10),
          amount: `MWK ${item.amount}`,
          status: item.paidAt ? "Paid" : "Pending",
          method: item.paidAt ? formatPaymentMethod(item.paymentMethod) : "-",
        }));
        setItems(mapped);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load contributions";
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout title="Contributions" subtitle="Your payment history">
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Contribution History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="mb-4 text-sm text-muted-foreground">Loading contributions...</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? items.map((item, index) => (
                <TableRow key={`${item.date}-${index}`}>
                  <TableCell className="font-medium">{item.date}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{item.method}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "Paid"
                          ? "bg-success/10 text-success hover:bg-success/20 border-0"
                          : "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    No contributions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default MemberContributions;
