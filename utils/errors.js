export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

export class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}

export class SystemError extends AppError {
  constructor(message) { super(message, 500); }
}