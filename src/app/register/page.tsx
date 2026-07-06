import Link from "next/link";
import { register } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tent } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  password_mismatch: "Passwords don't match.",
  weak_password: "Password must be at least 8 characters.",
  invalid_email: "That doesn't look like a valid email address.",
  email_taken: "An account with that email already exists — try signing in instead.",
  missing_name: "Please enter your name.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; name?: string; email?: string }>;
}) {
  const { error, name, email } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? "Something went wrong — try again." : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tent className="size-6" />
          </span>
          <h1 className="font-heading mt-4 text-2xl font-semibold tracking-tight">Set up your Base Camp</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account to track your own ventures
          </p>
        </div>
        <form action={register} className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={name ?? ""}
              className="mt-1.5"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={email ?? ""}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5"
            />
          </div>
          {errorMessage && <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>}
          <Button type="submit" className="w-full">
            Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
