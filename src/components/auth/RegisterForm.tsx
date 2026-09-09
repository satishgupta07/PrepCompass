"use client";

import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { useServerFormAction } from "@/lib/hooks/useServerFormAction";
import { Button } from "@/components/ui/Button";
import { inputClasses, labelClasses } from "@/components/ui/field-classes";

/** Plain (non-modal) sign-up form for /register — new accounts always start as role "user"; admin is a manual promotion (see scripts/make-admin.ts). */
export function RegisterForm() {
  const { error, isPending, handleSubmit } = useServerFormAction(registerAction, {
    resetOnSuccess: false,
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-name" className={labelClasses}>
          Name
        </label>
        <input
          id="register-name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-email" className={labelClasses}>
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="register-password" className={labelClasses}>
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClasses}
        />
      </div>
      {error && <p className="text-sm text-hard">{error}</p>}
      <Button type="submit" disabled={isPending} className="justify-center">
        {isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
