import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
      <LoginForm />
    </div>
  );
}
