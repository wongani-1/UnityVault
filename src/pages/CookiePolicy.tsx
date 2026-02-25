import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/landing/Footer";

const CookiePolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/Unity Vault.png"
              alt="UnityVault"
              className="h-8 w-8 rounded-lg"
            />
            <span className="hidden text-lg font-bold sm:inline">
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                UnityVault
              </span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-0 sm:py-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Cookie Policy</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last Updated: February 12, 2026
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none dark:prose-invert">
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">1. What Are Cookies?</h2>
                <p className="text-muted-foreground">
                  Cookies are small text files stored on your device to support platform functionality 
                  and security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">2. Types of Cookies We Use</h2>
                
                <h3 className="mb-3 text-lg font-semibold text-foreground">Essential Cookies</h3>
                <p className="mb-2 text-muted-foreground">Used for:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>User authentication</li>
                  <li>Session management</li>
                  <li>Group isolation</li>
                  <li>Security enforcement</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  These cookies are required for login and dashboard functionality.
                </p>

                <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">Performance Cookies</h3>
                <p className="mb-2 text-muted-foreground">Used to:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Improve system performance</li>
                  <li>Monitor usage trends</li>
                  <li>Detect technical errors</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  These are anonymous and do not identify individuals.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">3. What We Do Not Do</h2>
                <p className="mb-2 text-muted-foreground">We do not:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Sell cookie data</li>
                  <li>Use third-party advertising trackers</li>
                  <li>Track users across unrelated websites</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">4. Managing Cookies</h2>
                <p className="text-muted-foreground">
                  Users may disable cookies in browser settings.
                </p>
                <p className="mt-3 text-muted-foreground">
                  However, disabling essential cookies may prevent login and system access.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">5. Updates to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Cookie Policy as the platform evolves.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">6. Contact</h2>
                <p className="text-muted-foreground">
                  📧 support@unityvault.com
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
