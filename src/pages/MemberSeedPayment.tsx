import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { apiRequest } from "@/lib/api";

const MemberSeedPayment = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [mobileProvider, setMobileProvider] = useState<"airtel" | "tnm" | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seedAmount, setSeedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    mobileNumber: "",
    payerName: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    email: "",
  });

  // Fetch group settings to get seed amount
  useEffect(() => {
    const loadSeedAmount = async () => {
      try {
        setLoading(true);
        const group = await apiRequest<{ settings: { seedAmount?: number } }>("/groups/me");
        setSeedAmount(group.settings?.seedAmount || 0);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load seed amount";
        toast.error(message);
        setSeedAmount(0);
      } finally {
        setLoading(false);
      }
    };

    loadSeedAmount();
  }, []);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePay = async () => {
    // Validate form fields
    if (method === "mobile") {
      if (!form.payerName.trim() || !form.mobileNumber.trim()) {
        setFormError("Please fill in payer name and mobile number.");
        return;
      }
      if (!mobileProvider) {
        setFormError("Please select a mobile money provider (Airtel or TNM Mpamba).");
        return;
      }
      // Validate phone number format based on provider
      if (mobileProvider === "airtel") {
        if (!/^09\d{8}$/.test(form.mobileNumber)) {
          setFormError("Airtel Money number must be in format 09XXXXXXXX (10 digits starting with 09).");
          return;
        }
      } else if (mobileProvider === "tnm") {
        if (!/^08\d{8}$/.test(form.mobileNumber)) {
          setFormError("TNM Mpamba number must be in format 08XXXXXXXX (10 digits starting with 08).");
          return;
        }
      }
    } else {
      // Card payment validation
      const hasEmpty = [form.cardName, form.cardNumber, form.cardExpiry, form.cardCvv].some(
        (value) => value.trim().length === 0
      );
      if (hasEmpty) {
        setFormError("All card fields are required.");
        return;
      }
    }
    
    setFormError(null);
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Record seed deposit payment
      await apiRequest("/members/me/seed-payment", {
        method: "POST",
      });

      // Clear cached profile to force refresh on dashboard
      localStorage.removeItem("unityvault:memberProfile");

      toast.success("Seed deposit payment successful! You can now make contributions and apply for loans.");
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      toast.error(message);
      setFormError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading seed deposit information...</p>
        </div>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">Seed Deposit Payment</CardTitle>
            <CardDescription>
              Pay your one-time seed deposit to unlock contributions and loan eligibility.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Important Notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Required for Group Participation
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This is a one-time deposit required before you can make monthly contributions or apply for loans.
                    After payment, you'll gain full access to all group financial activities.
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                MWK {seedAmount?.toLocaleString() || "0"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Seed deposit (one-time, non-refundable)</p>
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
                    <Label htmlFor="mobile-number">Mobile number</Label>
                    <Input
                      id="mobile-number"
                      placeholder={
                        mobileProvider === "airtel"
                          ? "09XXXXXXXX"
                          : mobileProvider === "tnm"
                          ? "08XXXXXXXX"
                          : "e.g. 0991 000 000"
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
              <h3 className="text-sm font-semibold text-foreground">2. Additional options</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="save-method"
                  checked={saveForFuture}
                  onCheckedChange={(checked) => setSaveForFuture(checked === true)}
                />
                <Label htmlFor="save-method">Save this method for future payments</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payer-email">Receipt email (optional)</Label>
                <Input
                  id="payer-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
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
                disabled={isProcessing}
              >
                {isProcessing ? "Processing Payment..." : `Pay MWK ${seedAmount?.toLocaleString() || "0"}`}
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
      </div>
    </div>
  );
};

export default MemberSeedPayment;
