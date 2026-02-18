import { useEffect } from "react";
import { Users, UserPlus, TrendingUp, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Users,
    step: "01",
    title: "Create a Group",
    description: "Set up your savings group in minutes with custom rules and contribution schedules.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Add Members",
    description: "Invite members by phone or email and manage membership easily.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Track Contributions & Loans",
    description: "Record payments, manage loan applications, and track repayments transparently.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Generate Reports",
    description: "Export audit-ready financial summaries for meetings, auditors, and partners.",
  },
];

const HowItWorks = () => {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          } else {
            entry.target.classList.remove("in-view");
          }
        });
      },
      { threshold: 0.2 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="bg-secondary/50 py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in four simple steps. No technical skills required.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connector line */}
          <div className="absolute left-8 top-12 hidden h-[calc(100%-6rem)] w-px bg-border lg:left-1/2 lg:block lg:-translate-x-px" />

          <div className="grid gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div
                key={step.step}
                data-reveal
                className={`reveal ${i % 2 === 1 ? "reveal-right" : "reveal-left"} relative flex items-start gap-6 lg:gap-12 ${
                  i % 2 === 1 ? "lg:flex-row-reverse lg:text-right" : ""
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Step indicator */}
                <div className="relative z-10 flex-shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-float">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 rounded-xl bg-card p-6 shadow-card ${
                  i % 2 === 1 ? "lg:mr-[calc(50%+2rem)]" : "lg:ml-[calc(50%+2rem)]"
                }`}>
                  <span className="mb-1 text-sm font-bold text-primary">
                    Step {step.step}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
