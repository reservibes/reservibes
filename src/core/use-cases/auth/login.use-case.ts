import {
  LoginInputSchema,
  type LoginOutput,
} from "@/core/contracts/auth.contract";
import type { AuthProvider } from "@/core/ports/auth-provider.port";
import { DomainError, err, type Result } from "@/core/errors/domain-error";

export async function loginUseCase(
  auth: AuthProvider,
  rawInput: unknown
): Promise<Result<LoginOutput>> {
  const parsed = LoginInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return err(
      new DomainError(
        "INVALID_INPUT",
        firstIssue?.message ?? "Los datos ingresados no son válidos."
      )
    );
  }

  return auth.login(parsed.data);
}