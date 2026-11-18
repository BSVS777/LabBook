import { DomainError, ERROR_CODES } from '../../../shared/domain/domain-error.js';

export class LabNotFoundError extends DomainError {
  constructor() {
    super(ERROR_CODES.LAB_NOT_FOUND, 'The lab does not exist');
  }
}

export class LabInactiveError extends DomainError {
  constructor() {
    super(ERROR_CODES.LAB_INACTIVE, 'The lab is not available for reservations');
  }
}
