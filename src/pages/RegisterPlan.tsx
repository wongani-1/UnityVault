import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";

const RegisterPlan = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-5xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-0 sm:py-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to home</span>
        </Link>

        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step 1 of 2
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Select a Plan First</h1>
          <p className="mt-2 text-muted-foreground">
            Choose your subscription plan to continue to group creation.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className="flex h-full flex-col border-0 shadow-card">
              <CardHeader className="text-center">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="text-lg font-semibold text-foreground">
                  {plan.price === null ? "Custom pricing" : `MWK ${plan.price.toLocaleString()}${plan.period || ""}`}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4">
                <ul className="flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/register/form?plan=${plan.id}`} className="mt-auto block">
                  <Button variant={plan.variant} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegisterPlan;