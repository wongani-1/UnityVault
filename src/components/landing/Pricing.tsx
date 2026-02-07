import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const tiers = [
  {
    name: "Free",
    price: "0",
    description: "For small groups just getting started",
    features: [
      "Up to 15 members",
      "Basic contribution tracking",
      "Loan management",
      "Monthly reports",
      "Email notifications",
    ],
    cta: "Get Started Free",
    variant: "hero-outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "25,000",
    period: "/month",
    description: "For active groups that need full transparency",
    features: [
      "Up to 100 members",
      "Advanced contribution rules",
      "Automated penalty tracking",
      "SMS & email notifications",
      "Exportable audit reports",
      "Priority support",
    ],
    cta: "Start 14-Day Trial",
    variant: "hero" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For federations and large-scale programmes",
    features: [
      "Unlimited members & groups",
      "Multi-group management",
      "Custom branding",
      "API access & integrations",
      "Dedicated account manager",
      "On-site training & onboarding",
    ],
    cta: "Contact Sales",
    variant: "hero-outline" as const,
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="bg-secondary/50 py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and upgrade as your group grows. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col border-0 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 animate-fade-in opacity-0 ${
                tier.popular
                  ? "ring-2 ring-primary scale-[1.03] shadow-elevated"
                  : ""
              }`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-4 pt-8 text-center">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="mt-1">{tier.description}</CardDescription>
                <div className="mt-4">
                  {tier.price === "Custom" ? (
                    <span className="text-3xl font-bold text-foreground">Custom</span>
                  ) : (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-muted-foreground">MWK</span>
                      <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                      {tier.period && (
                        <span className="text-sm text-muted-foreground">{tier.period}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col px-6 pb-8">
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button variant={tier.variant} size="lg" className="w-full">
                    {tier.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
