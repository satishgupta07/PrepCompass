import { useState, useTransition, type FormEvent } from "react";

type ActionResult = { error?: string };

/**
 * Shared submit handling for the "modal form backed by a Server Action"
 * pattern used by AddPatternForm, AddProblemForm, and ProblemEditPanel:
 * submit via startTransition, surface a returned error, or reset/notify on
 * success. Options let each call site opt out of `form.reset()` (the edit
 * panel keeps its values visible) and hook in its own on-success behavior
 * (closing a modal, in every current case).
 */
export function useServerFormAction(
  action: (prevState: ActionResult, formData: FormData) => Promise<ActionResult>,
  { onSuccess, resetOnSuccess = true }: { onSuccess?: () => void; resetOnSuccess?: boolean } = {},
) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capture the form/FormData synchronously, before the event object is
    // recycled — `event.currentTarget` isn't safe to read once we're back
    // inside the async startTransition callback below.
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      // Server Actions here are called directly (not via the `action`
      // prop), so the "previous state" argument is always the initial `{}`.
      const result = await action({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      if (resetOnSuccess) form.reset();
      onSuccess?.();
    });
  }

  return { error, isPending, handleSubmit };
}
