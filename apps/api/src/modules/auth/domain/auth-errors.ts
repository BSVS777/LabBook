import { DomainError, ERROR_CODES } from '../../../shared/domain/domain-error.js';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super(ERROR_CODES.INVALID_CREDENTIALS, 'The email or password is incorrect');
  }
}

export class EmailAlreadyRegisteredError extends DomainError {
  constructor() {
    super(ERROR_CODES.EMAIL_ALREADY_REGISTERED, 'The email is already registered');
  }
}

export class UnauthenticatedError extends DomainError {
  constructor() {
    super(ERROR_CODES.UNAUTHENTICATED, 'Authentication is required');
  }
}
