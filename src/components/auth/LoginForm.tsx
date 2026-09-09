"use client";

import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { useServerFormAction } from "@/lib/hooks/useServerFormAction";
import { Button } from "@/components/ui/Button";
import { inputClasses, labelClasses } from "@/components/ui/field-classes";

/** Plain (non-modal) sign-in form for /login — see AddPatternForm etc. for the same useServerFormAction pattern used everywhere else. */
export function LoginForm() {
  const { error, isPending, handleSubmit } = useServerFormAction(loginAction, {
    resetOnSuccess: false,
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className={labelClasses}>
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className={labelClasses}>
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClasses}
        />
      </div>
      {error && <p className="text-sm text-hard">{error}</p>}
      <Button type="submit" disabled={isPending} className="justify-center">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
