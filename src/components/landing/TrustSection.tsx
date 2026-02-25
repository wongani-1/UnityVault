import { ShieldCheck, Landmark, Lock } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Your Money, Your Control",
    description: "We never hold or touch group funds. Your group decides where the money lives.",
  },
  {
    icon: Landmark,
    title: "Use Any Bank or Mobile Money",
    description: "Keep funds in your preferred bank account, mobile money wallet, or SACCO.",
  },
  {
    icon: Lock,
    title: "Built for Accountability",
    description: "Every transaction is logged with timestamps and member attribution for full transparency.",
  },
];

const TrustSection = () => {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-elevated sm:p-8 md:p-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
              Trust & Transparency
            </h2>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              We do not hold group funds. Each group controls its own money through its chosen financial institution.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
