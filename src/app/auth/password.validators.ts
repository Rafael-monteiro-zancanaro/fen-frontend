import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function utf8ByteLength(maximumBytes: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    const actualBytes = new TextEncoder().encode(value).length;
    return actualBytes <= maximumBytes ? null : { utf8ByteLength: { maximumBytes, actualBytes } };
  };
}
