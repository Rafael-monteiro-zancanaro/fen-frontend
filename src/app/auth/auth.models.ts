export type UserRole = 'ADMIN' | 'FARMACEUTICO' | 'ESTAGIARIO';

export type RegistrationRole = Exclude<UserRole, 'ADMIN'>;

export type InternshipType = 'OBRIGATORIO' | 'NAO_OBRIGATORIO';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface RegisterRequest {
  nome: string;
  cpf: string;
  dataNascimento?: string | null;
  email: string;
  senha: string;
  role: RegistrationRole;
  crf?: string | null;
  responsavelTecnico?: boolean | null;
  tipoEstagio?: InternshipType | null;
  supervisorId?: string | null;
  inicioVigencia?: string | null;
  fimVigencia?: string | null;
}

export interface RegistrationDetail {
  usuarioId: string;
  funcionarioId: string;
  email: string;
  role: RegistrationRole;
  situacao: 'PENDENTE';
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}
