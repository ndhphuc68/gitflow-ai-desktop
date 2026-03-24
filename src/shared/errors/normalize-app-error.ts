import { AppError, appErrorSchema } from "../types/app-error";

type NormalizeAppErrorFallback = {
  message: string;
};

export function normalizeAppError(
  rawError: unknown,
  fallback: NormalizeAppErrorFallback
): AppError {
  const parsedError = appErrorSchema.safeParse(rawError);
  if (parsedError.success) {
    return parsedError.data;
  }

  return {
    code: "UNKNOWN_ERROR",
    message: fallback.message,
    recoverable: false,
    details:
      rawError instanceof Error
        ? rawError.message
        : typeof rawError === "string"
          ? rawError
          : null,
  };
}
