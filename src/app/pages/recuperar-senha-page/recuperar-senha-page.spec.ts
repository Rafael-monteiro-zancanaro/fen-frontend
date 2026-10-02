import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { PasswordRecoveryService } from '../../domain/password-recovery.service';
import { RecuperarSenhaPage } from './recuperar-senha-page';

describe('RecuperarSenhaPage', () => {
  let fixture: ComponentFixture<RecuperarSenhaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarSenhaPage],
      providers: [
        provideRouter([]),
        { provide: PasswordRecoveryService, useValue: { create: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RecuperarSenhaPage);
    fixture.detectChanges();
  });

  it('focuses the first invalid field when the request form is incomplete', async () => {
    const page = fixture.nativeElement as HTMLElement;
    const email = page.querySelector<HTMLInputElement>('#recoveryEmail')!;
    const focus = vi.fn();
    (email as unknown as { focus: () => void }).focus = focus;

    page.querySelector<HTMLButtonElement>('[type="submit"]')?.click();
    fixture.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(page.querySelector('#recoveryEmailError')?.textContent).toContain(
      'E-mail é obrigatório',
    );
    expect(focus).toHaveBeenCalled();
  });
});
