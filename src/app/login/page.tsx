import Link from "next/link";
import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tent } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tent className="size-6" />
          </span>
          <h1 className="font-heading mt-4 text-2xl font-semibold tracking-tight">Brask Base Camp</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your venture command center</p>
        </div>
        <form action={login} className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
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
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5"
            />
          </div>
          {error && (
            <p className="text-sm text-red-700 dark:text-red-400">Incorrect email or password.</p>
          )}
          <Button type="submit" className="w-full">
            Enter Base Camp
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
