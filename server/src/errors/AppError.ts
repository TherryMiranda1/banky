export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", details?: unknown) {
    super(401, message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", details?: unknown) {
    super(403, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found", details?: unknown) {
    super(404, message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict", details?: unknown) {
    super(409, message, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal Server Error", details?: unknown) {
    super(500, message, details);
  }
}
