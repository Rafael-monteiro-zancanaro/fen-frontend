import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { FuncionarioService, PharmacyEmployee } from '../../domain/funcionario.service';
import { AdminFuncionariosPage } from './admin-funcionarios-page';

describe('AdminFuncionariosPage', () => {
  let fixture: ComponentFixture<AdminFuncionariosPage>;
  const pendingEmployee: PharmacyEmployee = {
    id: 'funcionario-1',
    userId: 'usuario-1',
    name: 'João da Silva',
    email: 'joao@fen.br',
    cpf: '12345678901',
    birthDate: '1990-01-01',
    role: 'FARMACEUTICO',
    status: 'Pendente',
    crf: 'PR-1',
    isTechnicalResponsible: false,
  };
  const activeEmployee: PharmacyEmployee = { ...pendingEmployee, status: 'Ativo' };
  const service = {
    list: vi.fn(),
    efetivar: vi.fn(),
  };

  beforeEach(async () => {
    service.list.mockReset();
    service.efetivar.mockReset();
    service.list.mockReturnValueOnce(of(page(pendingEmployee))).mockReturnValueOnce(of(page(activeEmployee)));
    service.efetivar.mockReturnValue(of(void 0));
    await TestBed.configureTestingModule({
      imports: [AdminFuncionariosPage],
      providers: [provideRouter([]), { provide: FuncionarioService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminFuncionariosPage);
    fixture.detectChanges();
  });

  it('confirms and reloads a pending employee after approval', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-approve-employee]')?.textContent).toContain('Efetivar');
    host.querySelector<HTMLButtonElement>('[data-approve-employee]')?.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-approve-dialog]')?.textContent).toContain('João da Silva');

    host.querySelector<HTMLButtonElement>('[data-confirm-approval]')?.click();
    fixture.detectChanges();

    expect(service.efetivar).toHaveBeenCalledWith('usuario-1');
    expect(service.list).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('Ativo');
    expect(host.querySelector('[data-approve-employee]')).toBeNull();
  });

  function page(employee: PharmacyEmployee) {
    return { content: [employee], number: 0, size: 10, totalElements: 1, totalPages: 1 };
  }
});
