import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/landing/Footer";

const FAQ = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is UnityVault?",
      answer: "UnityVault is a digital platform designed to help community savings groups (Village Savings & Loans) manage their contributions, loans, penalties, and financial records securely and efficiently."
    },
    {
      question: "How do I create a savings group?",
      answer: "Click on 'Create Group' from the homepage, set your group rules (monthly contribution amount, loan interest rate, penalties), and complete the registration. You'll receive a unique Group ID that members can use to join."
    },
    {
      question: "How do members join my group?",
      answer: "Share your unique Group ID with members. They can register using the member registration link, pay the one-time registration fee, complete their personal details, and they'll be added to your group."
    },
    {
      question: "What is a Group ID?",
      answer: "A Group ID is a unique system-generated identifier assigned to your savings group. It ensures complete isolation between groups - no one from another group can access your data."
    },
    {
      question: "Can I access another group's data?",
      answer: "No. The system enforces strict data isolation. Each user (admin or member) can only access data from their own group. This is enforced through role-based authentication."
    },
    {
      question: "How do I log in as a Group Admin?",
      answer: "Enter your email, and password. The system verifies all three to ensure you're logging into the correct group."
    },
    {
      question: "How do members log in?",
      answer: "Members only need their email and password. The system automatically maps them to their assigned group."
    },
    {
      question: "What happens if I forget my password?",
      answer: "Click 'Forgot Password' on the login page and follow the instructions. You'll receive a password reset link via email."
    },
    {
      question: "Can I change group rules after creation?",
      answer: "Yes, Group Admins can modify contribution amounts, interest rates, and penalty settings from the Admin Settings page."
    },
    {
      question: "How are loans managed?",
      answer: "Members can apply for loans through their dashboard. Group Admins review and approve loan requests. The system automatically tracks repayment schedules and calculates interest."
    },
    {
      question: "How do I track member contributions?",
      answer: "The Admin Dashboard shows all member contributions, payment status, and outstanding balances. You can also generate detailed reports."
    },
    {
      question: "What payment methods are supported?",
      answer: "The platform supports Mobile Money and Card payments. Payment integration ensures secure processing of registration fees and contributions."
    },
    {
      question: "Is my financial data secure?",
      answer: "Yes. We use encrypted passwords, secure authentication, role-based access control, audit logging, and session management to protect your data."
    },
    {
      question: "Can I export group reports?",
      answer: "Yes, Group Admins can generate and export financial reports including contribution summaries, loan reports, and audit logs."
    },
    {
      question: "What are penalties and how are they applied?",
      answer: "Penalties are automatically calculated based on your group's rules for late contributions or missed loan payments. Admins can view and manage penalties from the Penalties page."
    },
    {
      question: "How do notifications work?",
      answer: "The system sends notifications for upcoming payments, late penalties, loan approvals, and important group updates to keep members informed."
    },
    {
      question: "Can I deactivate a member?",
      answer: "Yes, Group Admins can deactivate member accounts from the Members management page. Contact support if you need to reactivate an account."
    },
    {
      question: "What browsers are supported?",
      answer: "UnityVault works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, UnityVault is a web-based platform optimized for both desktop and mobile browsers. A dedicated mobile app may be available in the future."
    },
    {
      question: "How do I contact support?",
      answer: "For support inquiries, email us at support@unityvault.com or visit the Contact Us page."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl">Frequently Asked Questions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Find answers to common questions about UnityVault
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b last:border-b-0 pb-4 last:pb-0"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-start justify-between gap-4 text-left transition-colors hover:text-primary"
                  >
                    <span className="font-semibold text-foreground">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-primary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {openIndex === index && (
                    <p className="mt-3 text-muted-foreground">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <Link to="/contact" className="font-medium text-primary hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ;
