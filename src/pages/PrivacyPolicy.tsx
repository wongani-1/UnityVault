import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
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
            <span className="text-lg font-bold">
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                UnityVault
              </span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last Updated: February 12, 2026
              </p>
              <p className="text-sm font-medium text-foreground">
                Platform Name: UnityVault
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none dark:prose-invert">
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">1. Introduction</h2>
                <p className="text-muted-foreground">
                  UnityVault ("we", "our", "the platform") provides a digital Savings & Loans 
                  management system for independent savings groups.
                </p>
                <p className="text-muted-foreground">
                  We are committed to protecting your privacy and ensuring your personal and financial 
                  data is handled securely and responsibly.
                </p>
                <p className="text-muted-foreground">
                  By using the platform, you agree to this Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">2. Information We Collect</h2>
                
                <h3 className="mb-3 text-lg font-semibold text-foreground">2.1 Personal Information</h3>
                <p className="mb-2 text-muted-foreground">We may collect:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Full name</li>
                  <li>Phone number</li>
                  <li>Email address</li>
                  <li>Username</li>
                  <li>Encrypted password</li>
                  <li>Role (Member or Group Admin)</li>
                </ul>

                <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">2.2 Financial & Activity Data</h3>
                <p className="mb-2 text-muted-foreground">We collect and store:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Contribution records</li>
                  <li>Loan records and repayment schedules</li>
                  <li>Penalties and compulsory interest records</li>
                  <li>Group balances</li>
                  <li>Timestamps of actions</li>
                  <li>Audit logs</li>
                </ul>

                <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">2.3 Technical Information</h3>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>IP address</li>
                  <li>Device type</li>
                  <li>Browser information</li>
                  <li>Login activity</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
                <p className="mb-2 text-muted-foreground">We use collected data to:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Authenticate users securely</li>
                  <li>Map users to the correct group</li>
                  <li>Enforce role-based permissions</li>
                  <li>Track savings, loans, and penalties</li>
                  <li>Generate financial reports</li>
                  <li>Send system notifications</li>
                  <li>Maintain audit logs</li>
                  <li>Improve system performance and security</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  <strong>We do not sell your personal data.</strong>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">4. Group Data Isolation</h2>
                <p className="text-muted-foreground">
                  Each group operates independently.
                </p>
                <p className="mb-2 text-muted-foreground">The system enforces strict data isolation using:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Unique system-generated Group IDs</li>
                  <li>Role-based access control</li>
                  <li>Authentication checks during login</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  <strong>No user can access another group's data.</strong>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">5. Data Sharing</h2>
                <p className="mb-2 text-muted-foreground">We may share data only:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>When required by law</li>
                  <li>With trusted service providers (e.g., SMS/email providers)</li>
                  <li>With explicit authorization from the group</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  <strong>We do not sell or rent user data to third parties.</strong>
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">6. Data Security</h2>
                <p className="mb-2 text-muted-foreground">We protect data through:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Encrypted passwords</li>
                  <li>Secure authentication mechanisms</li>
                  <li>Role-based access control</li>
                  <li>Audit logging</li>
                  <li>Session management</li>
                  <li>Optional two-factor authentication</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">7. Data Retention</h2>
                <p className="mb-2 text-muted-foreground">We retain data:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>While a group account remains active</li>
                  <li>As required for audit, regulatory, or legal purposes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">8. Your Rights</h2>
                <p className="mb-2 text-muted-foreground">You may:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Access your personal information</li>
                  <li>Request corrections</li>
                  <li>Request account deactivation (via your group admin)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy periodically. Continued use of the platform 
                  constitutes acceptance of updates.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">10. Contact</h2>
                <p className="mb-2 text-muted-foreground">For privacy-related inquiries:</p>
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

export default PrivacyPolicy;
