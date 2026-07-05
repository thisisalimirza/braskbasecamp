import { login } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Mountain className="mx-auto size-10 text-primary" />
          <h1 className="mt-2 text-xl font-semibold">Brask Base Camp</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form action={login} className="space-y-4 rounded-xl border p-6">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required className="mt-1" autoFocus />
          </div>
          {error && <p className="text-sm text-red-700 dark:text-red-400">Incorrect password.</p>}
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
