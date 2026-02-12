import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const MemberRegistrationPayment = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState({
    mobileNumber: "",
    payerName: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    email: "",
  });

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
    
    setFormError(null);
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get group ID from localStorage or URL
      const urlParams = new URLSearchParams(window.location.search);
      const groupId = urlParams.get("groupId") || localStorage.getItem("unityvault:pendingGroupId");

      toast.success("Payment successful!");
      
      // Redirect to registration details page
      if (groupId) {
        navigate(`/member/registration-details?groupId=${groupId}`);
      } else {
        navigate("/member/registration-details");
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
            <CardTitle className="text-2xl">Registration Fee</CardTitle>
            <CardDescription>Complete payment to access your member dashboard.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Amount Display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">MWK 2,500</div>
              <p className="mt-1 text-sm text-muted-foreground">Member registration fee</p>
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
                      placeholder="e.g. 0991 000 000"
                      value={form.mobileNumber}
                      onChange={(e) => updateField("mobileNumber", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Use the number registered for mobile payments.</p>
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
                {isProcessing ? "Processing Payment..." : "Pay MWK 2,500"}
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
