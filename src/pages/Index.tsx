import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import TrustSection from "@/components/landing/TrustSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
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
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <div className="reveal reveal-up" data-scroll-reveal>
          <Hero />
        </div>
        <div className="reveal reveal-up" data-scroll-reveal>
          <Features />
        </div>
        <div className="reveal reveal-up" data-scroll-reveal>
          <HowItWorks />
        </div>
        <div className="reveal reveal-up" data-scroll-reveal>
          <Pricing />
        </div>
        <div className="reveal reveal-up" data-scroll-reveal>
          <TrustSection />
        </div>
      </main>
      <div className="reveal reveal-up" data-scroll-reveal>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
