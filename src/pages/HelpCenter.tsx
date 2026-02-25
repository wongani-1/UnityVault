import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight, Users, Lock, DollarSign, FileText, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Footer from "@/components/landing/Footer";

const HelpCenter = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      title: "Getting Started",
      icon: Users,
      color: "text-blue-500",
      articles: [
        { title: "Getting Started Guide", id: "getting-started" },
        { title: "How Member Registration Works", id: "member-registration" },
        { title: "How Group Access Works", id: "group-access" },
      ]
    },
    {
      title: "Authentication & Login",
      icon: Lock,
      color: "text-green-500",
      articles: [
        { title: "How to Log In as a Group Admin", id: "admin-login" },
        { title: "How to Log In as a Member", id: "member-login" },
        { title: "I Forgot My Password", id: "forgot-password" },
        { title: "Can I Access Multiple Groups?", id: "multiple-groups" },
      ]
    },
    {
      title: "Contributions & Loans",
      icon: DollarSign,
      color: "text-yellow-500",
      articles: [
        { title: "How Contributions Work", id: "contributions" },
        { title: "How to Apply for a Loan", id: "apply-loan" },
        { title: "What Happens If You Miss a Loan Installment?", id: "missed-installment" },
        { title: "How Your Balance Is Calculated", id: "balance-calculation" },
      ]
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      color: "text-purple-500",
      articles: [
        { title: "How Your Data Is Protected", id: "data-protection" },
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      color: "text-orange-500",
      articles: [
        { title: "Why Am I Receiving Notifications?", id: "notifications" },
      ]
    },
  ];

  const filteredCategories = searchQuery
    ? categories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.articles.length > 0)
    : categories;

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

      {/* Hero Section */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Help Center</h1>
            <p className="mb-6 text-base text-muted-foreground sm:text-lg">
              Find answers and learn how to use UnityVault
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for help articles..."
                className="h-12 pl-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {filteredCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="border-0 shadow-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg bg-muted p-2 ${category.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.articles.map((article, idx) => (
                        <li key={idx}>
                          <Link
                            to={`/help/${article.id}`}
                            className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted"
                          >
                            <span className="text-sm text-foreground">{article.title}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* No Results */}
          {searchQuery && filteredCategories.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No articles found matching "{searchQuery}"
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 text-center">
            <Card className="border-0 bg-muted/30 shadow-none">
              <CardHeader>
                <CardTitle>Still need help?</CardTitle>
                <CardDescription>
                  Our support team is here to assist you
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/contact">
                  <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    Contact Support
                  </button>
                </Link>
                <Link to="/faq">
                  <button className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                    View FAQs
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HelpCenter;
