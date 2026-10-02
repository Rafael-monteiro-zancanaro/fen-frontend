import { focusFirstInvalidField } from './form-validation-focus';
import { vi } from 'vitest';

describe('focusFirstInvalidField', () => {
  it('scrolls and focuses the first visible invalid field after scheduling', () => {
    const root = document.createElement('form');
    const hidden = document.createElement('input');
    hidden.setAttribute('aria-invalid', 'true');
    hidden.hidden = true;
    const first = document.createElement('input');
    first.setAttribute('aria-invalid', 'true');
    const second = document.createElement('input');
    second.setAttribute('aria-invalid', 'true');
    root.append(hidden, first, second);
    document.body.append(root);

    const scroll = vi.fn();
    const focus = vi.fn();
    (first as unknown as { scrollIntoView: () => void }).scrollIntoView = scroll;
    (first as unknown as { focus: () => void }).focus = focus;
    const secondScroll = vi.fn();
    (second as unknown as { scrollIntoView: () => void }).scrollIntoView = secondScroll;
    (second as unknown as { focus: () => void }).focus = vi.fn();

    const beforeLocate = vi.fn();
    focusFirstInvalidField(root, {
      beforeLocate,
      schedule: (work: () => void) => work(),
    });

    expect(beforeLocate).toHaveBeenCalledOnce();
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(secondScroll).not.toHaveBeenCalled();
    root.remove();
  });
});
