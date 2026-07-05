import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tent } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tent className="size-6" />
          </span>
          <h1 className="font-heading mt-4 text-2xl font-semibold tracking-tight">Brask Base Camp</h1>
          <p className="mt-2 text-sm text-muted-foreground">Internal venture command center</p>
        </div>
        <form action={login} className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="mt-1.5" autoFocus />
          </div>
          {error && <p className="text-sm text-red-700 dark:text-red-400">Incorrect password.</p>}
          <Button type="submit" className="w-full">
            Enter Base Camp
          </Button>
        </form>
      </div>
    </div>
  );
}
