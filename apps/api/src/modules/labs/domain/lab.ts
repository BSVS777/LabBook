import { LabInactiveError } from './lab-errors.js';

export interface LabProps {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly capacity: number;
  readonly isActive: boolean;
}

export class Lab {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly capacity: number;
  readonly isActive: boolean;

  constructor(props: LabProps) {
    this.id = props.id;
    this.name = props.name;
    this.location = props.location;
    this.capacity = props.capacity;
    this.isActive = props.isActive;
  }

  assertBookable(): void {
    if (!this.isActive) throw new LabInactiveError();
  }
}
