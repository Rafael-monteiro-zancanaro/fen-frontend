import { Injectable } from '@angular/core';
import { onlyDigits } from './text-masks';

export interface ViaCepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

@Injectable({ providedIn: 'root' })
export class ViaCepService {
  async findAddressByCep(cep: string): Promise<ViaCepAddress | null> {
    const digits = onlyDigits(cep);

    if (digits.length !== 8) {
      return null;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as ViaCepResponse;

      if (data.erro) {
        return null;
      }

      const address: ViaCepAddress = {
        street: data.logradouro?.trim() ?? '',
        neighborhood: data.bairro?.trim() ?? '',
        city: data.localidade?.trim() ?? '',
        state: data.uf?.trim().toLocaleUpperCase('pt-BR') ?? '',
      };

      return address.street || address.neighborhood || address.city || address.state
        ? address
        : null;
    } catch {
      return null;
    }
  }
}
