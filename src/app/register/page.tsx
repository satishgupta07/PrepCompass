import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Create an account</h1>
      <RegisterForm />
    </div>
  );
}
