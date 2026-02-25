import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import {
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Distribution = {
  id: string;
  year: number;
  totalContributions: number;
  totalProfitPool: number;
  totalLoanInterest: number;
  totalPenalties: number;
  numberOfMembers: number;
  profitPerMember: number;
  status: "pending" | "completed" | "cancelled";
  distributedAt?: string;
  createdAt: string;
};

type MemberDistribution = {
  id: string;
  distributionId: string;
  memberId: string;
  memberName: string;
  totalContributions: number;
  profitShare: number;
  totalPayout: number;
  expectedContribution?: number;
  contributionShortfall?: number;
  outstandingLoan?: number;
  pendingPenalties?: number;
  complianceStatus?: "completed" | "partial" | "defaulted";
  paidAt?: string;
};

const AdminDistributions = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [memberBreakdown, setMemberBreakdown] = useState<MemberDistribution[]>([]);
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentCycleCompleted = distributions.find(
    (d) => d.year === currentYear && d.status === "completed"
  );

  useEffect(() => {
    loadDistributions();
  }, []);

  const loadDistributions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ items: Distribution[] }>("/distributions");
      setDistributions(data.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load distributions";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const distribution = await apiRequest<Distribution>("/distributions/calculate", {
        method: "POST",
        body: { year },
      });
      toast.success(`Distribution calculated for ${year}`);
      setSelectedDistribution(distribution);
      loadDistributions();
      
      // Load breakdown
      await loadBreakdown(year);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to calculate distribution";
      toast.error(message);
    } finally {
      setCalculating(false);
    }
  };

  const loadBreakdown = async (distYear: number) => {
    try {
      const data = await apiRequest<{ items: MemberDistribution[] }>(
        `/distributions/breakdown?year=${distYear}`
      );
      setMemberBreakdown(data.items);
      setShowBreakdown(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load breakdown";
      toast.error(message);
    }
  };

  const handleExecute = async () => {
    if (!selectedDistribution) return;

    setExecuting(true);
    try {
      await apiRequest("/distributions/execute", {
        method: "POST",
        body: { year: selectedDistribution.year },
      });
      toast.success("Distribution executed successfully!");
      setShowConfirmDialog(false);
      loadDistributions();
      setSelectedDistribution(null);
      setShowBreakdown(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to execute distribution";
      toast.error(message);
    } finally {
      setExecuting(false);
    }
  };

  const handleViewBreakdown = async (dist: Distribution) => {
    setSelectedDistribution(dist);
    await loadBreakdown(dist.year);
  };

  return (
    <DashboardLayout title="Year-End Distributions" subtitle="Manage annual profit sharing" isAdmin>
      <div className="space-y-6">
        {currentCycleCompleted && (
          <Card className="border-warning/30 bg-warning/10 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Cycle Locked</p>
                  <p className="text-xs text-muted-foreground">
                    Current cycle ({currentYear}) is closed since {currentCycleCompleted.distributedAt ? new Date(currentCycleCompleted.distributedAt).toLocaleDateString() : "distribution execution"}. New financial transactions are locked.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calculate Distribution Card */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Distribution
            </CardTitle>
            <CardDescription>
              Calculate year-end profit distribution for members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                />
              </div>
              <Button
                variant="hero"
                onClick={handleCalculate}
                disabled={calculating}
              >
                {calculating ? "Calculating..." : "Calculate Distribution"}
              </Button>
            </div>

            {selectedDistribution && selectedDistribution.status === "pending" && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-primary">Distribution Ready</h3>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Total Contributions</p>
                    <p className="text-lg font-semibold">
                      MWK {selectedDistribution.totalContributions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Profit Pool</p>
                    <p className="text-lg font-semibold text-success">
                      MWK {selectedDistribution.totalProfitPool.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profit Per Member</p>
                    <p className="text-lg font-semibold text-success">
                      MWK {selectedDistribution.profitPerMember.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="hero"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    Execute Distribution
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBreakdown(true)}
                  >
                    View Breakdown
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution History */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Distribution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : distributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No distributions found. Calculate one to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Total Contributions</TableHead>
                      <TableHead>Profit Pool</TableHead>
                      <TableHead>Profit/Member</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((dist) => (
                      <TableRow key={dist.id}>
                        <TableCell className="font-medium">{dist.year}</TableCell>
                        <TableCell>{dist.numberOfMembers}</TableCell>
                        <TableCell>MWK {dist.totalContributions.toLocaleString()}</TableCell>
                        <TableCell className="text-success">
                          MWK {dist.totalProfitPool.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-success">
                          MWK {dist.profitPerMember.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {dist.status === "completed" ? (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              Completed
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBreakdown(dist)}
                          >
                            View Details
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

        {/* Member Breakdown Dialog */}
        <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Distribution Breakdown - {selectedDistribution?.year}
              </DialogTitle>
              <DialogDescription>
                Final payout = Base Share - Contribution Shortfall - Outstanding Loan - Pending Penalties
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contributions</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Shortfall</TableHead>
                    <TableHead>Loan Balance</TableHead>
                    <TableHead>Pending Penalties</TableHead>
                    <TableHead>Base Share</TableHead>
                    <TableHead>Total Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberBreakdown.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.memberName}</TableCell>
                      <TableCell className="capitalize">{member.complianceStatus || "—"}</TableCell>
                      <TableCell>MWK {member.totalContributions.toLocaleString()}</TableCell>
                      <TableCell>MWK {(member.expectedContribution || 0).toLocaleString()}</TableCell>
                      <TableCell>MWK {(member.contributionShortfall || 0).toLocaleString()}</TableCell>
                      <TableCell>MWK {(member.outstandingLoan || 0).toLocaleString()}</TableCell>
                      <TableCell>MWK {(member.pendingPenalties || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-success">
                        MWK {member.profitShare.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-semibold">
                        MWK {member.totalPayout.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Execute Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Distribution Execution</DialogTitle>
              <DialogDescription>
                This will distribute{" "}
                <span className="font-semibold text-foreground">
                  MWK {selectedDistribution?.totalProfitPool.toLocaleString()}
                </span>{" "}
                in profits to {selectedDistribution?.numberOfMembers} members.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleExecute} disabled={executing}>
                {executing ? "Processing..." : "Confirm & Execute"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDistributions;
