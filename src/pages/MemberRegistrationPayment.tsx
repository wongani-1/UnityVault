import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { apiRequest } from "@/lib/api";

type SubscriptionPlanId = "starter" | "professional" | "enterprise";

const subscriptionPlans: Array<{
  id: SubscriptionPlanId;
  name: string;
  price: number | null;
  billing: string;
  subtitle: string;
  popularLabel?: string;
}> = [
  {
    id: "starter",
    name: "Starter",
    price: 15000,
    billing: "month",
    subtitle: "For small savings groups starting their digital journey",
  },
  {
    id: "professional",
    name: "Professional",
    price: 45000,
    billing: "month",
    subtitle: "For growing savings groups",
    popularLabel: "Most Popular for Savings Groups",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    billing: "custom",
    subtitle: "For SACCOs, organizations, and financial networks",
  },
];

const MemberRegistrationPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [mobileProvider, setMobileProvider] = useState<"airtel" | "tnm" | null>(null);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("professional");
  const [form, setForm] = useState({
    mobileNumber: "",
    payerName: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    email: "",
  });

  // Determine if this is admin subscription or member registration based on path
  const isAdminSubscription = useMemo(() => {
    return location.pathname.includes("admin");
  }, [location.pathname]);

  const selectedPlan = useMemo(
    () => subscriptionPlans.find((plan) => plan.id === selectedPlanId) || subscriptionPlans[1],
    [selectedPlanId]
  );

  const paymentAmount = isAdminSubscription ? selectedPlan.price : 5000;
  const paymentTitle = isAdminSubscription ? "UnityVault Subscription" : "Registration Fee";
  const paymentDescription = isAdminSubscription 
    ? "Choose a plan to activate your admin subscription."
    : "Complete payment to access your member dashboard.";
  const paymentNote = isAdminSubscription
    ? paymentAmount === null
      ? "Custom pricing and onboarding"
      : `Monthly subscription fee (renews every 30 days)`
    : "Member registration fee (one-time, non-refundable)";

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
      if (isAdminSubscription && selectedPlan.price === null) {
        toast.info("Enterprise uses custom pricing. Please contact support for setup.");
        setIsProcessing(false);
        return;
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (isAdminSubscription) {
        // Admin subscription payment
        await apiRequest("/admins/me/subscription-payment", {
          method: "POST",
          body: {
            planId: selectedPlan.id,
          },
        });

        toast.success(`${selectedPlan.name} subscription activated successfully!`);
        navigate("/admin/members");
      } else {
        // Member registration payment
        const token = localStorage.getItem("unityvault:token");
        const role = localStorage.getItem("unityvault:role");

        if (token && role === "member") {
          // For logged-in member, record registration fee payment
          await apiRequest("/members/me/registration-payment", {
            method: "POST",
          });

          toast.success("Registration fee payment successful!");
          navigate("/dashboard");
        } else {
          // For new member activation flow, continue to registration details
          const urlParams = new URLSearchParams(window.location.search);
          const groupId = urlParams.get("groupId") || localStorage.getItem("unityvault:pendingGroupId");

          toast.success("Payment successful!");
          
          if (groupId) {
            navigate(`/member/registration-details?groupId=${groupId}`);
          } else {
            navigate("/member/registration-details");
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      toast.error(message);
      setFormError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-2xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{paymentTitle}</CardTitle>
            <CardDescription>{paymentDescription}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
              {isAdminSubscription && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Select subscription plan</h3>
                  <div className="grid gap-3">
                    {subscriptionPlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`rounded-lg border p-4 text-left transition-all ${
                            isSelected ? "border-primary ring-2 ring-primary/30" : "border-border"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">{plan.name}</p>
                              <p className="text-xs text-muted-foreground">{plan.subtitle}</p>
                              {plan.popularLabel && (
                                <p className="mt-1 text-xs font-medium text-primary">{plan.popularLabel}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {plan.price === null ? "Custom Pricing" : `MWK ${plan.price.toLocaleString()}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {plan.price === null ? "" : `/${plan.billing}`}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Amount Display */}
            <div className="text-center">
                <div className="text-4xl font-bold text-foreground">
                  {paymentAmount === null ? "Custom Pricing" : `MWK ${paymentAmount.toLocaleString()}`}
                </div>
              <p className="mt-1 text-sm text-muted-foreground">{paymentNote}</p>
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
                disabled={isProcessing || (isAdminSubscription && paymentAmount === null)}
              >
                {isProcessing
                  ? "Processing Payment..."
                  : paymentAmount === null
                  ? "Contact Sales for Enterprise"
                  : `Pay MWK ${paymentAmount.toLocaleString()}`}
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

export default MemberRegistrationPayment;
