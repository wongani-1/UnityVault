import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/landing/Footer";

const HelpArticle = () => {
  const { articleId } = useParams<{ articleId: string }>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [articleId]);

  const articles: Record<string, { title: string; content: JSX.Element }> = {
    "admin-login": {
      title: "How to Log In as a Group Admin",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Group Admins log in using their:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Email (or username)</li>
            <li>Password</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            <strong>You do not need to enter a Group ID.</strong>
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Steps to Log In</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground mb-6">
            <li>Go to the Login page</li>
            <li>Enter your registered email or username</li>
            <li>Enter your password</li>
            <li>Click Login</li>
          </ol>

          <p className="text-muted-foreground mb-4">
            Once authenticated, the system automatically loads your assigned group dashboard.
          </p>
          <p className="text-muted-foreground mb-6">
            You will see your group name displayed at the top of your dashboard.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Important</h3>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Each admin account is permanently linked to one group.</li>
            <li>You cannot access another group using the same account.</li>
            <li>If you believe you are seeing the wrong group information, contact support immediately.</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-3">Common Login Issues</h3>
          <div className="space-y-3 text-muted-foreground">
            <p><strong>Incorrect password</strong><br />Double-check your spelling and ensure Caps Lock is off.</p>
            <p><strong>Account not found</strong><br />Make sure you are using the email registered during group creation.</p>
            <p><strong>Account suspended</strong><br />Contact support if your access has been restricted.</p>
          </div>
        </>
      )
    },
    "member-login": {
      title: "How to Log In as a Member",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Members log in using:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Username or email</li>
            <li>Password</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            <strong>You do not need to enter a Group ID.</strong>
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Steps</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground mb-6">
            <li>Go to the Login page</li>
            <li>Enter your username or email</li>
            <li>Enter your password</li>
            <li>Click Login</li>
          </ol>

          <p className="text-muted-foreground mb-4">
            The system automatically connects you to your assigned group.
          </p>
          <p className="text-muted-foreground">
            <strong>You cannot accidentally access another group.</strong>
          </p>
        </>
      )
    },
    "group-access": {
      title: "How Group Access Works",
      content: (
        <>
          <p className="text-muted-foreground mb-6">
            Every account in the system is linked to one specific group.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">When you log in:</h3>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Your identity is verified</li>
            <li>Your role (Admin or Member) is confirmed</li>
            <li>Your group is loaded automatically</li>
          </ul>

          <p className="text-muted-foreground mb-6">
            All data you see — contributions, loans, reports — belongs only to your assigned group.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">This ensures:</h3>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Financial privacy</li>
            <li>Data security</li>
            <li>Accurate reporting</li>
          </ul>

          <p className="text-muted-foreground">
            <strong>There is no manual group selection.</strong>
          </p>
        </>
      )
    },
    "member-registration": {
      title: "How Member Registration Works",
      content: (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-3">Step 1: Join a Group</h3>
          <p className="text-muted-foreground mb-4">You can join a group by:</p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Receiving an invitation from a Group Admin</li>
            <li>Using an approved registration link</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-3">Step 2: Create Your Account</h3>
          <p className="text-muted-foreground mb-4">You will enter:</p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Your name</li>
            <li>Username</li>
            <li>Password</li>
          </ul>
          <p className="text-muted-foreground mb-6">
            Your account will be marked as <strong>Pending Approval</strong>.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Step 3: Admin Approval</h3>
          <p className="text-muted-foreground mb-4">
            A Group Admin must approve your registration before you can access the dashboard.
          </p>
          <p className="text-muted-foreground">
            Once approved, you will be able to log in normally.
          </p>
        </>
      )
    },
    "contributions": {
      title: "How Contributions Work",
      content: (
        <>
          <p className="text-muted-foreground mb-4">Each group defines:</p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>A fixed contribution amount</li>
            <li>A due date</li>
            <li>Penalty rules for late payments</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-3">What Happens Each Month</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground mb-6">
            <li>A contribution record is created for each member</li>
            <li>Payment is made</li>
            <li>The admin confirms the payment in the system</li>
            <li>Your contribution history is visible in your dashboard</li>
          </ol>

          <h3 className="text-lg font-semibold text-foreground mb-3">If You Miss a Payment</h3>
          <p className="text-muted-foreground mb-4">
            If the due date passes without confirmation:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>The system marks the payment as late</li>
            <li>A penalty may be applied automatically</li>
            <li>You may receive a notification</li>
            <li>Outstanding balances remain visible until cleared</li>
          </ul>
        </>
      )
    },
    "apply-loan": {
      title: "How to Apply for a Loan",
      content: (
        <>
          <p className="text-muted-foreground mb-6">
            Members can apply for loans directly from their dashboard.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">Steps</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground mb-6">
            <li>Log in</li>
            <li>Click Apply for Loan</li>
            <li>Enter the loan amount</li>
            <li>Submit your request</li>
          </ol>

          <p className="text-muted-foreground mb-6">
            Your Group Admin will review and either approve or reject the request.
          </p>

          <h3 className="text-lg font-semibold text-foreground mb-3">If Approved</h3>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>A repayment schedule is created</li>
            <li>Interest is calculated based on group rules</li>
            <li>Installment dates are displayed in your dashboard</li>
          </ul>
        </>
      )
    },
    "missed-installment": {
      title: "What Happens If You Miss a Loan Installment?",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            If a loan installment is not paid by its due date:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>The installment is marked as overdue</li>
            <li>A penalty may be added (if enabled by your group)</li>
            <li>You may receive reminders</li>
            <li>Unpaid installments may prevent you from applying for new loans</li>
          </ul>
        </>
      )
    },
    "balance-calculation": {
      title: "How Your Balance Is Calculated",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            Your balance is automatically calculated using:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg mb-6">
            <p className="text-foreground font-mono text-sm">
              Total Contributions<br />
              + Interest Earned<br />
              - Loan Principal<br />
              - Loan Interest<br />
              - Penalties
            </p>
          </div>
          <p className="text-muted-foreground mb-4">
            All calculations are done by the system.
          </p>
          <p className="text-muted-foreground">
            <strong>Balances cannot be manually edited by members.</strong>
          </p>
        </>
      )
    },
    "notifications": {
      title: "Why Am I Receiving Notifications?",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            You may receive notifications for:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Upcoming contribution deadlines</li>
            <li>Missed payments</li>
            <li>Loan approvals or rejections</li>
            <li>Penalties applied</li>
            <li>Account status updates</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-3">Notifications may appear:</h3>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Inside the app</li>
            <li>Via email</li>
            <li>Via SMS (if enabled)</li>
          </ul>
        </>
      )
    },
    "multiple-groups": {
      title: "Can I Access Multiple Groups?",
      content: (
        <>
          <p className="text-muted-foreground mb-6">
            <strong>Each account is linked to one group only.</strong>
          </p>
          <p className="text-muted-foreground">
            If you need access to another group, you must register separately using a different email address.
          </p>
        </>
      )
    },
    "data-protection": {
      title: "How Your Data Is Protected",
      content: (
        <>
          <p className="text-muted-foreground mb-4">
            We protect your data using:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground mb-6">
            <li>Encrypted passwords</li>
            <li>Secure login sessions</li>
            <li>Role-based access control</li>
            <li>Group-level data isolation</li>
            <li>Activity logs for transparency</li>
          </ul>
          <p className="text-muted-foreground mb-4">
            <strong>Admins cannot access other groups.</strong>
          </p>
          <p className="text-muted-foreground">
            Members cannot view other members' private financial details unless permitted by group rules.
          </p>
        </>
      )
    },
    "forgot-password": {
      title: "I Forgot My Password",
      content: (
        <>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground mb-6">
            <li>Click <strong>Forgot Password</strong> on the Login page</li>
            <li>Enter your registered email</li>
            <li>Follow the reset instructions</li>
            <li>Create a new password</li>
          </ol>
          <p className="text-muted-foreground">
            If you do not receive a reset email, contact support.
          </p>
        </>
      )
    },
    "getting-started": {
      title: "Getting Started",
      content: (
        <>
          <h3 className="text-lg font-semibold text-foreground mb-3">For Admins</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground mb-6">
            <li>Create your group</li>
            <li>Log in using your email and password</li>
            <li>Add members</li>
            <li>Set contribution and loan rules</li>
            <li>Monitor activity and approve requests</li>
          </ol>

          <h3 className="text-lg font-semibold text-foreground mb-3">For Members</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted-foreground">
            <li>Register or accept invitation</li>
            <li>Wait for approval</li>
            <li>Log in</li>
            <li>View contributions and loan status</li>
          </ol>
        </>
      )
    },
  };

  const article = articleId ? articles[articleId] : null;

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Article Not Found</h1>
        <Link to="/help" className="text-primary hover:underline">
          Return to Help Center
        </Link>
      </div>
    );
  }

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
            to="/help"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-0 sm:py-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Help Center</span>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              <Home className="h-4 w-4" />
            </Link>
            <span>/</span>
            <Link to="/help" className="hover:text-foreground">
              Help Center
            </Link>
            <span>/</span>
            <span className="text-foreground">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Card className="border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">{article.title}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none dark:prose-invert">
              {article.content}
            </CardContent>
          </Card>

          {/* Help CTA */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Was this article helpful?{" "}
              <Link to="/contact" className="font-medium text-primary hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpArticle;
