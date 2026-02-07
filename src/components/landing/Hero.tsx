import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/hero-illustration.png";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(158,64%,36%,0.08),transparent)]" />

      <div className="container relative mx-auto px-4 py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text Content */}
          <div className="max-w-xl animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-xs font-medium text-secondary-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Trusted by 500+ savings groups
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Smart Savings & Loans Management{" "}
              <span className="text-primary">for Groups</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Track contributions, loans, penalties, and reports — transparently
              and securely. Your group stays in control of its money.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button variant="hero" size="xl">
                  Create a Group
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline" size="xl">
                  Member Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative animate-fade-in [animation-delay:200ms] opacity-0">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/10 blur-2xl" />
              <img
                src={heroIllustration}
                alt="Group savings network illustration showing connected community members"
                className="relative w-full rounded-2xl"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
