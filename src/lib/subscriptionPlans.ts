export type SubscriptionPlanId = "starter" | "professional" | "enterprise";

export type SubscriptionPlanConfig = {
  id: SubscriptionPlanId;
  name: string;
  price: number | null;
  period?: "/month";
  description: string;
  features: string[];
  cta: string;
  variant: "hero" | "hero-outline";
  popular?: boolean;
  popularLabel?: string;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: "starter",
    name: "Starter",
    price: 15000,
    period: "/month",
    description: "For small savings groups",
    features: [
      "14-day free trial",
      "Up to 10 members",
      "Single-group management",
      "Contribution tracking",
      "Loan and penalty tracking",
      "Email notifications",
    ],
    cta: "Start 14-Day Trial",
    variant: "hero-outline",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: 45000,
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
    variant: "hero",
    popular: true,
    popularLabel: "Most Popular for Savings Groups",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For SACCOs, organizations, and financial networks",
    features: [
      "Unlimited members",
      "Multi-group management",
      "Custom pricing and onboarding",
      "Dedicated support and implementation",
      "Advanced controls for large deployments",
    ],
    cta: "Contact Sales",
    variant: "hero-outline",
    popular: false,
  },
];

export const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export const getSubscriptionPlanConfig = (planId: SubscriptionPlanId) =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);