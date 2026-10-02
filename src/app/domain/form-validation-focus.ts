export interface FocusFirstInvalidFieldOptions {
  beforeLocate?: () => void;
  schedule?: (work: () => void) => void;
}

export function focusFirstInvalidField(
  root: HTMLElement,
  options: FocusFirstInvalidFieldOptions = {},
): void {
  options.beforeLocate?.();
  (options.schedule ?? scheduleAfterRender)(() => {
    const field = Array.from(root.querySelectorAll<HTMLElement>('[aria-invalid="true"]'))
      .find((element) => isFocusable(element) && isVisible(element));

    if (!field) {
      return;
    }

    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      field.focus({ preventScroll: true });
    } catch {
      field.focus();
    }
  });
}

function scheduleAfterRender(work: () => void): void {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => work());
    return;
  }

  queueMicrotask(work);
}

function isFocusable(element: HTMLElement): boolean {
  return element.matches('input, select, textarea, button, [tabindex]') && !element.hasAttribute('disabled');
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.closest('[hidden], [aria-hidden="true"]')) {
    return false;
  }

  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}
