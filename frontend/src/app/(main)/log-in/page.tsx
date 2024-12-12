import { logIn } from "@/actions/log-in";
import { signUp } from "@/actions/sign-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";

interface LoginPageProps {
  searchParams: { redirect?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <form className="max-w-md mx-auto p-4">
      <Stack direction="col" gap={2} alignItems="start">
        <input
          type="hidden"
          name="redirect"
          value={searchParams.redirect ?? "/"}
        />
        <label htmlFor="email">Email:</label>
        <Input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <Input id="password" name="password" type="password" required />
        <Button formAction={logIn}>Log in</Button>
        <Button formAction={signUp}>Sign up</Button>
      </Stack>
    </form>
  );
}
