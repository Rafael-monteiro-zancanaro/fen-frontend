import { AttendanceStatus, PharmaceuticalServiceKey } from './clinical-records';

export const PHARMACEUTICAL_SERVICE_LABELS: Record<PharmaceuticalServiceKey, string> = {
  'cuidados-farmaceuticos': 'Cuidados farmacêuticos',
  'aplicacao-injetaveis': 'Aplicação de injetáveis',
  inaloterapia: 'Inaloterapia',
  'servicos-farmaceuticos': 'Serviços farmacêuticos',
  'acompanhamento-farmacoterapeutico': 'Farmacoterapia',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  CONCLUIDO: 'Concluído',
  AGUARDANDO_RETORNO: 'Aguardando retorno',
  EXPIRADO: 'Expirado',
};
