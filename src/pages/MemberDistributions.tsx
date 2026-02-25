import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { TrendingUp, Calendar, CheckCircle2, Clock, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MemberDistribution = {
  id: string;
  distributionId: string;
  year: number;
  totalContributions: number;
  profitShare: number;
  totalPayout: number;
  status: "pending" | "completed";
  paidAt?: string;
  createdAt: string;
};

type EstimatedPayout = {
  year: number;
  baseShare: number;
  expectedContribution: number;
  actualContribution: number;
  remainingContributionBalance: number;
  loanBalance: number;
  pendingPenalties: number;
  complianceStatus: "completed" | "partial" | "defaulted";
  estimatedPayout: number;
};

const MemberDistributions = () => {
  const [distributions, setDistributions] = useState<MemberDistribution[]>([]);
  const [estimatedPayout, setEstimatedPayout] = useState<EstimatedPayout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistributions();
  }, []);

  const loadDistributions = async () => {
    setLoading(true);
    try {
      const [data, estimate] = await Promise.all([
        apiRequest<{ items: MemberDistribution[] }>("/distributions/member"),
        apiRequest<EstimatedPayout>(`/distributions/estimate?year=${new Date().getFullYear()}`).catch(
          () => null
        ),
      ]);
      setDistributions(data.items);
      setEstimatedPayout(estimate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load distributions";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const totalEarned = distributions
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + d.profitShare, 0);

  const totalReceived = distributions
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + d.totalPayout, 0);

  return (
    <DashboardLayout title="My Distributions" subtitle="Your year-end profit distributions">
      <div className="space-y-6">
        {/* Live Estimate */}
        {estimatedPayout && (
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle>Live Estimated Payout ({estimatedPayout.year})</CardTitle>
              <CardDescription>
                Based on current contributions, loans, and penalties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Your expected payout</p>
                  <p className="text-xl font-semibold">MWK {estimatedPayout.estimatedPayout.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining contribution balance</p>
                  <p className="text-xl font-semibold">MWK {estimatedPayout.remainingContributionBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Loan balance</p>
                  <p className="text-xl font-semibold">MWK {estimatedPayout.loanBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success sm:text-2xl">
                MWK {totalEarned.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From all completed distributions
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">MWK {totalReceived.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Contributions + Profit
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distributions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">{distributions.length}</div>
              <p className="text-xs text-muted-foreground">
                {distributions.filter((d) => d.status === "completed").length} completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution History */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Distribution History</CardTitle>
            <CardDescription>
              Your year-end distribution records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : distributions.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No distributions yet. Check back at year-end!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Contributions</TableHead>
                      <TableHead>Profit Share</TableHead>
                      <TableHead>Total Payout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((dist) => (
                      <TableRow key={dist.id}>
                        <TableCell className="font-medium">{dist.year}</TableCell>
                        <TableCell>MWK {dist.totalContributions.toLocaleString()}</TableCell>
                        <TableCell className="text-success font-medium">
                          MWK {dist.profitShare.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          MWK {dist.totalPayout.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {dist.status === "completed" ? (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {dist.paidAt
                            ? new Date(dist.paidAt).toLocaleDateString()
                            : new Date(dist.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-0 shadow-card bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">How Distributions Work</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Base share is calculated from cycle fund and eligible members</li>
              <li>• Shortfalls, outstanding loans, and pending penalties reduce payout</li>
              <li>• Repayments and interest improve your projected payout over time</li>
              <li>• Final payout is confirmed when admin executes cycle distribution</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MemberDistributions;
