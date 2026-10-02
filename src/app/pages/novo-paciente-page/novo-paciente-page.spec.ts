import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { ComorbidityService } from '../../domain/comorbidity.service';
import { PatientService } from '../../domain/patient.service';
import { ViaCepService } from '../../domain/via-cep.service';
import { NovoPacientePage } from './novo-paciente-page';

describe('NovoPacientePage', () => {
  let fixture: ComponentFixture<NovoPacientePage>;
  const createResult = new Subject<{ id: string }>();
  const create = vi.fn(() => createResult);

  beforeEach(async () => {
    create.mockClear();
    await TestBed.configureTestingModule({
      imports: [NovoPacientePage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: PatientService, useValue: { create, findByCpf: vi.fn(() => of(null)) } },
        { provide: ComorbidityService, useValue: { list: vi.fn(() => of({ content: [] })) } },
        { provide: ViaCepService, useValue: { findAddressByCep: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NovoPacientePage);
    fixture.detectChanges();
  });

  it('marks all required patient fields and skips the request when invalid', async () => {
    const page = fixture.nativeElement as HTMLElement;
    const cpf = page.querySelector<HTMLInputElement>('#cpfUsuario')!;
    const focus = vi.fn();
    (cpf as unknown as { focus: () => void }).focus = focus;
    page.querySelector<HTMLButtonElement>('[type="submit"]')?.click();
    fixture.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    expect(page.querySelector('#dataNascimentoUsuarioError')?.textContent).toContain(
      'Data de nascimento é obrigatória',
    );
    expect(create).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
  });

  it('disables the submit button while the patient request is pending', () => {
    fill('#cpfUsuario', '12345678901');
    fill('#nomeUsuario', 'Maria');
    fill('#dataNascimentoUsuario', '1990-01-01');
    fill('#celularUsuario', '44999999999');
    const page = fixture.nativeElement as HTMLElement;
    page.querySelector<HTMLButtonElement>('[type="submit"]')?.click();
    fixture.detectChanges();

    const button = page.querySelector<HTMLButtonElement>('[type="submit"]')!;
    expect(create).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Salvando');
  });

  function fill(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }
});
