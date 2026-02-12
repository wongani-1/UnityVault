import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
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

const loanRequests = [
  {
    member: "Robert Ochieng",
    amount: "MWK 300,000",
    purpose: "School fees",
    date: "2026-02-03",
    status: "Pending",
  },
  {
    member: "Alice Namukasa",
    amount: "MWK 150,000",
    purpose: "Medical",
    date: "2026-01-28",
    status: "Approved",
  },
  {
    member: "David Mukiibi",
    amount: "MWK 200,000",
    purpose: "Business stock",
    date: "2026-01-15",
    status: "Disbursed",
  },
];

const AdminLoans = () => {
  return (
    <DashboardLayout title="Loans" subtitle="Review and track group loans" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Loan Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanRequests.map((loan) => (
                <TableRow key={`${loan.member}-${loan.date}`}>
                  <TableCell className="font-medium">{loan.member}</TableCell>
                  <TableCell>{loan.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{loan.purpose}</TableCell>
                  <TableCell className="text-muted-foreground">{loan.date}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        loan.status === "Approved"
                          ? "bg-success/10 text-success hover:bg-success/20 border-0"
                          : loan.status === "Pending"
                          ? "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                          : "bg-info/10 text-info hover:bg-info/20 border-0"
                      }
                    >
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {loan.status === "Pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button variant="default" size="sm">
                          Approve
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminLoans;
