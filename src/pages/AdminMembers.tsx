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
import { UserPlus, CheckCircle, XCircle } from "lucide-react";

const members = [
  {
    name: "Alice Namukasa",
    phone: "+256 701 234 567",
    status: "Active",
    contributions: "MWK 300,000",
    loans: "MWK 0",
    joined: "2025-01-15",
  },
  {
    name: "Robert Ochieng",
    phone: "+256 702 345 678",
    status: "Active",
    contributions: "MWK 250,000",
    loans: "MWK 100,000",
    joined: "2025-01-20",
  },
  {
    name: "Grace Atim",
    phone: "+256 703 456 789",
    status: "Pending",
    contributions: "MWK 0",
    loans: "MWK 0",
    joined: "2026-02-01",
  },
];

const AdminMembers = () => {
  return (
    <DashboardLayout title="Members" subtitle="Approve and manage group members" isAdmin>
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Member Directory</CardTitle>
          <Button variant="hero" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Contributions</TableHead>
                <TableHead>Outstanding Loans</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.name}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.phone}</TableCell>
                  <TableCell>{member.contributions}</TableCell>
                  <TableCell>{member.loans}</TableCell>
                  <TableCell className="text-muted-foreground">{member.joined}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        member.status === "Active"
                          ? "bg-success/10 text-success hover:bg-success/20 border-0"
                          : "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                      }
                    >
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.status === "Pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        View
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

export default AdminMembers;
