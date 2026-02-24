import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const tiers = [
  {
    name: "Starter",
    price: "15,000",
    period: "/month",
    description: "For small savings groups starting their digital journey",
    features: [
      "Up to 10 members",
      "Single-group management",
      "Contribution tracking",
      "Loan and penalty tracking",
      "Email notifications",
    ],
    cta: "Choose Starter",
    variant: "hero-outline" as const,
    popular: false,
  },
  {
    name: "Professional",
    price: "45,000",
    period: "/month",
    description: "For growing savings groups",
    features: [
      "Up to 100 members",
      "Single-group management",
      "Advanced contribution workflows",
      "Automated penalty and loan tracking",
      "Email notifications",
      "Exportable audit reports",
      "Priority support options",
    ],
    cta: "Choose Professional",
    variant: "hero" as const,
    popular: true,
    popularLabel: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For SACCOs, organizations, and financial networks",
    features: [
      "Unlimited members",
      "Multi-group management",
      "Custom pricing and onboarding",
      "Dedicated support and implementation",
      "Advanced controls for large deployments",
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
                  <span className="inline-block max-w-[220px] rounded-lg bg-gradient-primary px-3 py-1 text-center text-xs font-semibold leading-tight text-primary-foreground shadow-sm">
                    {tier.popularLabel || "Most Popular"}
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
