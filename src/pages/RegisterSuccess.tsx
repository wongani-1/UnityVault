import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Copy, Check, Shield, ArrowLeft } from "lucide-react";

/** Generate a human-friendly group ID like GB-8F3K2 */
const generateGroupId = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GB-${code}`;
};

type SuccessState = {
  groupId?: string;
  groupName?: string;
  adminName?: string;
};

const RegisterSuccess = () => {
  const location = useLocation();
  const state = (location.state as SuccessState) || {};
  const [copied, setCopied] = useState(false);

  const groupId = useMemo(() => state.groupId ?? generateGroupId(), [state.groupId]);

  const handleCopyGroupId = () => {
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(158,64%,36%,0.06),transparent)]" />

      <div className="relative w-full max-w-lg">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-success/15">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-2xl">Group created successfully</CardTitle>
            <CardDescription>
              {state.groupName ? (
                <>
                  Your group <span className="font-medium text-foreground">{state.groupName}</span> is ready.
                </>
              ) : (
                <>Your group is ready.</>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Shield className="h-3.5 w-3.5" />
                    Your Group ID
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-foreground">
                    {groupId}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Save this ID. You’ll need it to sign in as an admin.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyGroupId} className="shrink-0">
                  {copied ? (
                    <Check className="mr-1.5 h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {state.adminName && (
              <p className="text-sm text-muted-foreground">
                Admin: <span className="font-medium text-foreground">{state.adminName}</span>
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="w-full">
                <Button variant="hero" size="lg" className="w-full">
                  Go to Admin Login
                </Button>
              </Link>
              <Link to="/" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterSuccess;
