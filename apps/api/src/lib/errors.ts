/**
 * Errors the API raises deliberately. Anything else reaching the error handler
 * is a bug and becomes a 500 with no detail leaked to the caller.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

/** The request exists but the action is not legal in its current state. */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class PayloadTooLargeError extends DomainError {
  constructor(message: string) {
    super(message, 413);
  }
}
