import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    image: "/audit-checklist.jpg",
    title: "Secure Member Records",
    description:
      "Keep all member data safe and organized with role-based access controls and audit trails.",
  },
  {
    image: "/budgeting-sheet.jpg",
    title: "Transparent Loan Tracking",
    description:
      "Every loan application, approval, and repayment is visible to authorized members in real time.",
  },
  {
    image: "/loan-tracking.jpg",
    title: "Automated Penalties & Notifications",
    description:
      "Set rules once — the system tracks missed payments and notifies members automatically.",
  },
  {
    image: "/financial-report.png",
    title: "Audit-Ready Financial Reports",
    description:
      "Generate monthly and yearly reports with a click. Perfect for auditors and compliance.",
  },
];

const Features = () => {
  const track = [...features, ...features];
  return (
    <section id="features" className="bg-background py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Everything your group needs
          </h2>
          <p className="text-lg text-muted-foreground">
            Purpose-built tools for village banking, chamas, and savings groups.
          </p>
        </div>

        <div className="overflow-hidden">
          <div className="flex w-max gap-6 animate-feature-marquee">
            {track.map((feature, i) => (
              <Card
                key={`${feature.title}-${i}`}
                className="group w-[280px] border-0 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-gradient-card sm:w-[360px] md:w-[420px]"
              >
                <div className="relative h-44 w-full overflow-hidden rounded-t-xl sm:h-56">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Powered by</span>
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          <img
            src="/DevStudios.png"
            alt="DevStudios logo"
            className="h-40 w-auto opacity-95"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
