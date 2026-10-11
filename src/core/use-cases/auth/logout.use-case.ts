import type { LogoutOutput } from "@/core/contracts/auth.contract";
import type { AuthProvider } from "@/core/ports/auth-provider.port";
import type { Result } from "@/core/errors/domain-error";

export async function logoutUseCase(
  auth: AuthProvider
): Promise<Result<LogoutOutput>> {
  return auth.logout();
}