import { Shield, Eye, Bell, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Secure Member Records",
    description:
      "Keep all member data safe and organized with role-based access controls and audit trails.",
  },
  {
    icon: Eye,
    title: "Transparent Loan Tracking",
    description:
      "Every loan application, approval, and repayment is visible to authorized members in real time.",
  },
  {
    icon: Bell,
    title: "Automated Penalties & Notifications",
    description:
      "Set rules once — the system tracks missed payments and notifies members automatically.",
  },
  {
    icon: FileText,
    title: "Audit-Ready Financial Reports",
    description:
      "Generate monthly and yearly reports with a click. Perfect for auditors and compliance.",
  },
];

const Features = () => {
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className="group border-0 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-gradient-card animate-fade-in opacity-0"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
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
    </section>
  );
};

export default Features;
