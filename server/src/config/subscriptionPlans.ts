export type SubscriptionPlanId = "starter" | "professional" | "enterprise";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  monthlyPrice: number | null;
  memberLimit: number | null;
  manageMultipleGroups: boolean;
  isCustomPricing?: boolean;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 15000,
    memberLimit: 10,
    manageMultipleGroups: false,
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 45000,
    memberLimit: 100,
    manageMultipleGroups: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    memberLimit: null,
    manageMultipleGroups: true,
    isCustomPricing: true,
  },
];

export const getSubscriptionPlan = (planId: SubscriptionPlanId) =>
  SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
