import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/landing/Footer";

const TermsOfService = () => {
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
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last Updated: February 12, 2026
              </p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none dark:prose-invert">
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using UnityVault, you agree to these Terms of Service.
                </p>
                <p className="text-muted-foreground">
                  If you do not agree, you must not use the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">2. Description of Service</h2>
                <p className="mb-2 text-muted-foreground">The platform provides digital tools for:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Group savings tracking</li>
                  <li>Loan management</li>
                  <li>Contribution monitoring</li>
                  <li>Penalty enforcement</li>
                  <li>Reporting and auditing</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  The platform may integrate payment systems but does not operate as a licensed bank 
                  unless explicitly stated.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">3. Account Structure & Access</h2>
                
                <h3 className="mb-3 text-lg font-semibold text-foreground">3.1 Group Creation</h3>
                <p className="mb-2 text-muted-foreground">When a group is created:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>A unique Group ID is generated automatically</li>
                  <li>A Group Admin account is linked permanently to that Group ID</li>
                </ul>

                <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">3.2 Admin Authentication</h3>
                <p className="mb-2 text-muted-foreground">Group Admins must log in using:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Username or email</li>
                  <li>Password</li>
                </ul>
                <p className="mb-2 mt-3 text-muted-foreground">Authentication verifies:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>The Group ID exists</li>
                  <li>The admin belongs to that group</li>
                  <li>Credentials are valid</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  <strong>Admins cannot access other groups.</strong>
                </p>

                <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">3.3 Member Authentication</h3>
                <p className="mb-2 text-muted-foreground">Members log in using:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Username/email</li>
                  <li>Password</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  The system automatically maps members to their assigned group. Members cannot switch 
                  or access other groups.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">4. Responsibilities</h2>
                
                <h3 className="mb-3 text-lg font-semibold text-foreground">Group Admins</h3>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Manage group members</li>
                  <li>Approve loans</li>
                  <li>Ensure accuracy of financial entries</li>
                  <li>Maintain compliance with group rules</li>
                </ul>

                <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground">Members</h3>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Protect login credentials</li>
                  <li>Meet contribution and loan obligations</li>
                  <li>Follow group policies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">5. Group Funds</h2>
                <p className="text-muted-foreground">
                  Groups are responsible for their own funds.
                </p>
                <p className="mb-2 mt-3 text-muted-foreground">The platform:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Tracks financial data</li>
                  <li>Generates reports</li>
                  <li>Does not assume responsibility for internal financial disputes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">6. Prohibited Use</h2>
                <p className="mb-2 text-muted-foreground">Users may not:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Attempt to access other groups' data</li>
                  <li>Bypass authentication</li>
                  <li>Provide false information</li>
                  <li>Use the platform for illegal activities</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">7. Suspension & Termination</h2>
                <p className="mb-2 text-muted-foreground">We may suspend or terminate accounts if:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>These terms are violated</li>
                  <li>Fraud or abuse is detected</li>
                  <li>Required by law</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
                <p className="mb-2 text-muted-foreground">The platform is not responsible for:</p>
                <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                  <li>Financial losses within a group</li>
                  <li>Mismanagement by group admins</li>
                  <li>Internal group disputes</li>
                  <li>Failures of third-party payment providers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">9. Modifications</h2>
                <p className="text-muted-foreground">
                  We may modify the platform or these terms at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">10. Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms are governed by the laws of Malawi.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">11. Contact</h2>
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

export default TermsOfService;
