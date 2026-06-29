export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} не найден`, 404, 'NOT_FOUND');
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(balance: number, required: number) {
    super(
      `Недостаточно коинов. Баланс: ${balance}, требуется: ${required}`,
      400,
      'INSUFFICIENT_BALANCE'
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(message || 'Доступ запрещён', 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
