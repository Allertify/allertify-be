export class AppError extends Error{
  statusCode: number;
  constructor(message: string, statusCode = 500){
    super(message);
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError{
  constructor(message = "Unauthorized"){
    super(message, 401);
  }
}

export class ForbiddenError extends AppError{
  constructor(message = "Forbidden"){
    super(message, 403);
  }
}

export class ValidationError extends AppError{
  constructor(message = "Validation error"){
    super(message, 400);
  }
}
