import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, ShieldCheck, Share2, TrendingUp } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { apiRequest } from "@/lib/api";
import { isValidEmail } from "@/lib/contactValidation";

const MemberSharePurchase = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegistrationFlow = searchParams.get("registration") === "1";
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [mobileProvider, setMobileProvider] = useState<"airtel" | "tnm" | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shareFee, setShareFee] = useState<number>(0);
  const [initialLoanAmount, setInitialLoanAmount] = useState<number>(0);
  const [currentShares, setCurrentShares] = useState<number>(0);
  const [sharesToPurchase, setSharesToPurchase] = useState<number>(1);
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

  // Load share purchase details
  useEffect(() => {
    const loadShareDetails = async () => {
      try {
        setLoading(true);
        
        // Get shares from URL or localStorage
        const sharesParam = searchParams.get("shares");
        const shares = sharesParam ? parseInt(sharesParam) : parseInt(sessionStorage.getItem("unityvault:pendingShares") || "1");
        setSharesToPurchase(Math.max(1, shares));

        // Fetch member profile and group settings
        const [member, group] = await Promise.all([
          apiRequest<{ sharesOwned?: number }>("/members/me"),
          apiRequest<{ settings: { shareFee?: number; initialLoanAmount?: number } }>("/groups/me"),
        ]);

        setCurrentShares(member.sharesOwned || 0);
        setShareFee(group.settings?.shareFee || 0);
        setInitialLoanAmount(group.settings?.initialLoanAmount || 0);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load share details";
        toast.error(message);
        setShareFee(0);
      } finally {
        setLoading(false);
        sessionStorage.removeItem("unityvault:pendingShares");
      }
    };

    loadShareDetails();
  }, [searchParams]);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const totalCost = shareFee * sharesToPurchase;
  const newTotalShares = currentShares + sharesToPurchase;
  const newLoanLimit = initialLoanAmount * newTotalShares;

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

    if (form.email.trim() && !isValidEmail(form.email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    
    setFormError(null);
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Record share purchase
      await apiRequest("/members/me/share-purchase", {
        method: "POST",
        body: { shares: sharesToPurchase },
      });

      // Clear cached profile to force refresh on dashboard
      sessionStorage.removeItem("unityvault:memberProfile");

      if (isRegistrationFlow) {
        toast.success("Share purchase successful. Continue to seed deposit payment.");
        navigate("/member/seed-payment?registration=1");
      } else {
        toast.success(`Successfully purchased ${sharesToPurchase} share${sharesToPurchase > 1 ? 's' : ''}! Your new loan limit is MWK ${newLoanLimit.toLocaleString()}.`);
        navigate("/dashboard");
      }
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
          <p className="text-sm text-muted-foreground">Loading share purchase details...</p>
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Share2 className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Purchase Shares</CardTitle>
            <CardDescription>
              Increase your loan eligibility by purchasing more shares
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Share Details Summary */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current shares owned:</span>
                <span className="font-semibold">{currentShares}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current loan limit:</span>
                <span className="font-semibold">MWK {(currentShares * initialLoanAmount).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shares to purchase:</span>
                <span className="font-bold text-primary text-lg">{sharesToPurchase}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price per share:</span>
                <span className="font-semibold">MWK {shareFee.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New total shares:</span>
                <span className="font-bold text-lg">{newTotalShares}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  New loan limit:
                </span>
                <span className="font-bold text-lg text-success">
                  MWK {newLoanLimit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Amount Display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                MWK {totalCost.toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Total cost for {sharesToPurchase} share{sharesToPurchase > 1 ? 's' : ''}
              </p>
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
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
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
                  autoComplete="email"
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
                {isProcessing ? "Processing Payment..." : `Pay MWK ${totalCost.toLocaleString()}`}
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

export default MemberSharePurchase;
