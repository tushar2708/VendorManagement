import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";
import { DomainError } from "../lib/errors.js";

/**
 * `instanceof ZodError` is not safe here.
 *
 * better-auth pulls in zod 4, which takes the hoisted root slot, so every
 * workspace installs its own nested zod 3. `apps/api` and `packages/shared`
 * therefore hold two separate copies of the same version — and a class from one
 * copy is not the class from the other, so validation failures raised by shared
 * schemas fell through to the 500 branch and users saw "Internal server error"
 * for an ordinary typo.
 *
 * Matching on shape instead holds however many copies are installed, and across
 * both zod majors.
 */
function isZodError(error: unknown): error is ZodError {
  if (error instanceof ZodError) return true;

  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "ZodError" &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (isZodError(error)) {
    response.status(400).json({
      success: false,
      error: "Invalid request",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof DomainError) {
    response.status(error.status).json({ success: false, error: error.message });
    return;
  }

  // Unexpected: log it in full, tell the caller nothing.
  logger.error(error);
  response.status(500).json({ success: false, error: "Internal server error" });
};
