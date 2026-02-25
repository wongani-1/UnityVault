import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, ShieldCheck, Loader2, Download, CheckCircle } from "lucide-react";
import { apiRequest, apiDownload } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Contribution {
  id: string;
  amount: number;
  month: string;
  status: string;
  dueDate: string;
}

interface LoanInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  status: string;
  dueDate: string;
  paidAt?: string;
}

interface Loan {
  id: string;
  balance: number;
  principal: number;
  totalDue: number;
  installments: LoanInstallment[];
}

interface Penalty {
  id: string;
  amount: number;
  isPaid: boolean;
}

const MemberContributionPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentType = searchParams.get("type") || "contribution";
  
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mobileProvider, setMobileProvider] = useState<"airtel" | "tnm" | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(50000);
  const [paymentData, setPaymentData] = useState<{
    contributions: Contribution[];
    loans: Loan[];
    penalties: Penalty[];
  }>({ contributions: [], loans: [], penalties: [] });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paidItemId, setPaidItemId] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  
  const [form, setForm] = useState({
    mobileNumber: "",
    payerName: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    email: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load group settings first to get contribution amount
        const settings = await apiRequest<{
          contributionAmount: number;
          loanInterestRate: number;
          penaltyRate: number;
        }>("/groups/settings");
        setContributionAmount(settings.contributionAmount);

        if (paymentType === "contribution") {
          const data = await apiRequest<{ items: Contribution[] }>("/contributions");
          setPaymentData(prev => ({ ...prev, contributions: data.items }));
        } else if (paymentType === "loan") {
          const data = await apiRequest<{ items: Loan[] }>("/loans");
          setPaymentData(prev => ({ ...prev, loans: data.items }));
        } else if (paymentType === "penalty") {
          const data = await apiRequest<{ items: Penalty[] }>("/penalties");
          setPaymentData(prev => ({ ...prev, penalties: data.items }));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load payment data";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [paymentType]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      // Reload group settings
      const settings = await apiRequest<{
        contributionAmount: number;
        loanInterestRate: number;
        penaltyRate: number;
      }>("/groups/settings");
      setContributionAmount(settings.contributionAmount);

      if (paymentType === "contribution") {
        const data = await apiRequest<{ items: Contribution[] }>("/contributions");
        setPaymentData(prev => ({ ...prev, contributions: data.items }));
      } else if (paymentType === "loan") {
        const data = await apiRequest<{ items: Loan[] }>("/loans");
        setPaymentData(prev => ({ ...prev, loans: data.items }));
      } else if (paymentType === "penalty") {
        const data = await apiRequest<{ items: Penalty[] }>("/penalties");
        setPaymentData(prev => ({ ...prev, penalties: data.items }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load payment data";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const downloadReceipt = async () => {
    if (!paidItemId) return;

    setDownloadingReceipt(true);
    try {
      let url = "";
      if (paymentType === "contribution") {
        url = `/receipts/contribution/${paidItemId}`;
      } else if (paymentType === "loan") {
        url = `/receipts/loan/${paidItemId}`;
      }

      if (!url) {
        toast.error("Could not generate receipt");
        return;
      }

      // Download the PDF
      const blob = await apiDownload(url);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `receipt-${paidItemId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download receipt";
      toast.error(message);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const paymentInfo = useMemo(() => {
    if (loading) {
      return {
        title: "Loading...",
        description: "Fetching payment details",
        amount: "0",
        label: "Please wait",
        itemId: null,
        installmentId: undefined,
      };
    }

    switch (paymentType) {
      case "loan": {
        const activeLoans = paymentData.loans.filter(l => l.balance > 0);
        let nextInstallment: LoanInstallment | null = null;
        let loanId: string | null = null;

        // Find the first unpaid installment across all active loans
        for (const loan of activeLoans) {
          const unpaidInstallments = loan.installments.filter(
            inst => inst.status === "unpaid" || inst.status === "overdue"
          );
          if (unpaidInstallments.length > 0) {
            nextInstallment = unpaidInstallments[0];
            loanId = loan.id;
            break;
          }
        }

        return {
          title: "Loan Payment",
          description: "Repay your loan installment",
          amount: nextInstallment ? nextInstallment.amount.toLocaleString() : "0",
          label: nextInstallment 
            ? `Installment #${nextInstallment.installmentNumber} (P: ${nextInstallment.principalAmount.toLocaleString()} + I: ${nextInstallment.interestAmount.toLocaleString()})`
            : "No installments due",
          itemId: loanId,
          installmentId: nextInstallment?.id,
        };
      }
      case "penalty": {
        const unpaidPenalties = paymentData.penalties.filter(p => !p.isPaid);
        const totalDue = unpaidPenalties.reduce((sum, p) => sum + p.amount, 0);
        return {
          title: "Penalty Payment",
          description: "Clear your pending penalties",
          amount: totalDue.toLocaleString(),
          label: `${unpaidPenalties.length} pending ${unpaidPenalties.length !== 1 ? 'penalties' : 'penalty'}`,
          itemId: unpaidPenalties[0]?.id || null,
          installmentId: undefined,
        };
      }
      default: {
        const unpaidContributions = paymentData.contributions.filter(
          c => c.status === "unpaid" || c.status === "overdue"
        );
        const totalDue = unpaidContributions.reduce((sum, c) => sum + c.amount, 0);
        return {
          title: "Pay Contribution",
          description: "Complete your monthly contribution payment",
          amount: totalDue > 0 ? totalDue.toLocaleString() : contributionAmount.toLocaleString(),
          label: unpaidContributions.length > 0 
            ? `${unpaidContributions.length} unpaid contribution${unpaidContributions.length !== 1 ? 's' : ''}`
            : "Monthly contribution",
          itemId: unpaidContributions[0]?.id || null,
          installmentId: undefined,
        };
      }
    }
  }, [paymentType, contributionAmount, paymentData, loading]);

  const handlePay = async () => {
    const requiredFields =
      method === "mobile"
        ? [form.mobileNumber, form.payerName]
        : [form.cardName, form.cardNumber, form.cardExpiry, form.cardCvv];

    const hasEmpty = requiredFields.some((value) => value.trim().length === 0);
    
    if (hasEmpty) {
      setFormError("All fields are required.");
      return;
    }

    // Validate mobile money provider and format
    if (method === "mobile") {
      if (!mobileProvider) {
        setFormError("Please select a mobile money provider (Airtel or TNM Mpamba).");
        return;
      }

      const mobileNumber = form.mobileNumber.replace(/\s/g, "");
      
      if (mobileProvider === "airtel") {
        if (!mobileNumber.match(/^09\d{8}$/)) {
          setFormError("Airtel Money number must be in format 09XXXXXXXX (10 digits starting with 09).");
          return;
        }
      } else if (mobileProvider === "tnm") {
        if (!mobileNumber.match(/^08\d{8}$/)) {
          setFormError("TNM Mpamba number must be in format 08XXXXXXXX (10 digits starting with 08).");
          return;
        }
      }
    }

    setFormError(null);
    setProcessing(true);

    try {
      // Process payment based on type
      let paidId = null;
      if (paymentType === "contribution" && paymentInfo.itemId) {
        const selectedPaymentMethod =
          method === "card"
            ? "card"
            : mobileProvider === "airtel"
            ? "airtel_money"
            : "tnm_mpamba";

        await apiRequest("/contributions/pay", {
          method: "POST",
          body: {
            contributionId: paymentInfo.itemId,
            paymentMethod: selectedPaymentMethod,
          },
        });
        paidId = paymentInfo.itemId;
        toast.success("Contribution payment recorded successfully!");
      } else if (paymentType === "loan" && paymentInfo.itemId && paymentInfo.installmentId) {
        await apiRequest(`/loans/${paymentInfo.itemId}/repay`, {
          method: "POST",
          body: { installmentId: paymentInfo.installmentId },
        });
        paidId = paymentInfo.installmentId; // Use installment ID for receipt
        toast.success("Loan installment payment recorded successfully!");
      } else if (paymentType === "penalty" && paymentInfo.itemId) {
        await apiRequest(`/penalties/${paymentInfo.itemId}/pay`, {
          method: "POST",
        });
        paidId = paymentInfo.itemId;
        toast.success("Penalty payment recorded successfully!");
      } else {
        toast.error("No unpaid items found");
        return;
      }

      // Show success modal with receipt download option
      setPaidItemId(paidId);
      setPaymentSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      toast.error(message);
      setFormError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-2xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-xl sm:text-2xl">{paymentInfo.title}</CardTitle>
            <CardDescription>{paymentInfo.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Amount Display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">MWK {paymentInfo.amount}</div>
              <p className="mt-1 text-sm text-muted-foreground">{paymentInfo.label}</p>
            </div>
            <Separator />

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">1. Select payment method</h3>
              <Tabs value={method} onValueChange={(value) => setMethod(value as "mobile" | "card")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mobile">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Mobile Money
                  </TabsTrigger>
                  <TabsTrigger value="card">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Card Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mobile" className="mt-4 space-y-4">
                  {/* Mobile Money Provider Logos */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
                      Select Mobile Money Service
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setMobileProvider("airtel")}
                        className={`flex h-20 w-32 items-center justify-center rounded-md border bg-white p-2 transition-all hover:shadow-md ${
                          mobileProvider === "airtel" ? "ring-2 ring-primary ring-offset-2" : ""
                        }`}
                      >
                        <img 
                          src="/Airtel logo.png" 
                          alt="Airtel Money" 
                          className="h-full w-full object-contain"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileProvider("tnm")}
                        className={`flex h-20 w-32 items-center justify-center rounded-md border bg-white p-2 transition-all hover:shadow-md ${
                          mobileProvider === "tnm" ? "ring-2 ring-primary ring-offset-2" : ""
                        }`}
                      >
                        <img 
                          src="/mpamba.png" 
                          alt="Mpamba by TNM" 
                          className="h-full w-full object-contain"
                        />
                      </button>
                    </div>
                    {mobileProvider && (
                      <p className="mt-3 text-center text-xs font-medium text-primary">
                        {mobileProvider === "airtel" ? "Airtel Money selected" : "TNM Mpamba selected"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payer-name">Payer name</Label>
                    <Input
                      id="payer-name"
                      placeholder="e.g. Thandiwe Banda"
                      value={form.payerName}
                      onChange={(e) => updateField("payerName", e.target.value)}
                    />
                  </div>
                    <div className="space-y-2">
                <Label htmlFor="payer-email">Email </Label>
                <Input
                  id="payer-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>


                  <div className="space-y-2">
                    <Label htmlFor="mobile-number">Mobile number</Label>
                    <Input
                      id="mobile-number"
                      placeholder={
                        mobileProvider === "airtel"
                          ? "09XXXXXXXX"
                          : mobileProvider === "tnm"
                          ? "08XXXXXXXX"
                          : "e.g. 0991 XXX XXX"
                      }
                      value={form.mobileNumber}
                      onChange={(e) => updateField("mobileNumber", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {mobileProvider === "airtel"
                        ? "Airtel Money format: 09XXXXXXXX"
                        : mobileProvider === "tnm"
                        ? "TNM Mpamba format: 08XXXXXXXX"
                        : "Use the number registered for mobile payments."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="card" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Name on card</Label>
                    <Input
                      id="card-name"
                      placeholder="e.g. Thandiwe Banda"
                      value={form.cardName}
                      onChange={(e) => updateField("cardName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={form.cardNumber}
                      onChange={(e) => updateField("cardNumber", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="card-expiry">Expiry</Label>
                      <Input
                        id="card-expiry"
                        placeholder="MM/YY"
                        value={form.cardExpiry}
                        onChange={(e) => updateField("cardExpiry", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-cvv">CVV</Label>
                      <Input
                        id="card-cvv"
                        placeholder="123"
                        value={form.cardCvv}
                        onChange={(e) => updateField("cardCvv", e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We never store your full card details.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-method"
                  checked={saveForFuture}
                  onCheckedChange={(checked) => setSaveForFuture(checked === true)}
                />
                <Label htmlFor="save-method">Save this method for future payments</Label>
              </div>
            </div>

            {/* Action Area */}
            <div className="space-y-3">
              {formError && (
                <p className="text-center text-sm text-destructive">{formError}</p>
              )}
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full" 
                onClick={handlePay}
                disabled={processing || loading || !paymentInfo.itemId}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : loading ? (
                  "Loading..."
                ) : !paymentInfo.itemId ? (
                  "No payments due"
                ) : (
                  `Pay MWK ${paymentInfo.amount}`
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure payment · Encrypted processing
              </div>
              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our terms and privacy policy.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <Link to="/terms" className="hover:text-foreground">Terms</Link>
                <span>·</span>
                <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Success Dialog */}
        <Dialog open={paymentSuccess} onOpenChange={setPaymentSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-center">Payment Successful!</DialogTitle>
              <DialogDescription className="text-center">
                Your {paymentType} payment has been processed successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={downloadReceipt}
                disabled={downloadingReceipt}
                className="w-full"
              >
                {downloadingReceipt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setPaymentSuccess(false);
                  navigate("/dashboard");
                }}
                className="w-full"
              >
                Back to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MemberContributionPayment;
