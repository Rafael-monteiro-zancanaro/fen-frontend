export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 9);
  const verifier = digits.slice(9, 11);

  if (digits.length > 9) {
    return `${first}.${second}.${third}-${verifier}`;
  }

  if (digits.length > 6) {
    return `${first}.${second}.${third}`;
  }

  if (digits.length > 3) {
    return `${first}.${second}`;
  }

  return first;
}

export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  return digits;
}

export function maskBrazilianPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const areaCode = digits.slice(0, 2);
  const firstPart = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const secondPart = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

  if (digits.length > 10) {
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  if (digits.length > 6) {
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  if (digits.length > 2) {
    return `(${areaCode}) ${firstPart}`;
  }

  if (digits.length > 0) {
    return `(${areaCode}`;
  }

  return '';
}
