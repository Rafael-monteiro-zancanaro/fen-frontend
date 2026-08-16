import { Injectable, computed, signal } from '@angular/core';
import {
  Comorbidity,
  CreateComorbidityInput,
  CreateMedicationInput,
  Medication,
} from './clinical-records';

interface TemporaryClinicalRecordsState {
  medications: Medication[];
  comorbidities: Comorbidity[];
}

const STORAGE_KEY = 'fen-temporary-clinical-records';

@Injectable({ providedIn: 'root' })
export class TemporaryClinicalRecordsStore {
  private readonly state = signal<TemporaryClinicalRecordsState>(this.readInitialState());

  readonly medications = computed(() => this.state().medications);
  readonly comorbidities = computed(() => this.state().comorbidities);

  createMedication(input: CreateMedicationInput): Medication {
    const medication: Medication = {
      id: this.createId(),
      name: input.name.trim(),
      measurementUnit: input.measurementUnit.trim(),
      administrationRoute: input.administrationRoute.trim(),
      createdAt: new Date().toISOString(),
    };

    this.updateState({
      ...this.state(),
      medications: [...this.state().medications, medication],
    });

    return medication;
  }

  getMedication(id: string): Medication | undefined {
    return this.state().medications.find((medication) => medication.id === id);
  }

  updateMedication(id: string, input: CreateMedicationInput): Medication | undefined {
    const existingMedication = this.getMedication(id);

    if (!existingMedication) {
      return undefined;
    }

    const updatedMedication: Medication = {
      ...existingMedication,
      name: input.name.trim(),
      measurementUnit: input.measurementUnit.trim(),
      administrationRoute: input.administrationRoute.trim(),
    };

    this.updateState({
      ...this.state(),
      medications: this.state().medications.map((medication) =>
        medication.id === id ? updatedMedication : medication,
      ),
    });

    return updatedMedication;
  }

  searchMedications(term: string): Medication[] {
    const query = this.normalize(term);

    if (!query) {
      return this.state().medications;
    }

    return this.state().medications.filter((medication) =>
      this.normalize(
        `${medication.name} ${medication.measurementUnit} ${medication.administrationRoute}`,
      ).includes(query),
    );
  }

  deleteMedication(id: string): void {
    this.updateState({
      medications: this.state().medications.filter((medication) => medication.id !== id),
      comorbidities: this.state().comorbidities.map((comorbidity) => ({
        ...comorbidity,
        medicationInteractionIds: comorbidity.medicationInteractionIds.filter(
          (medicationId) => medicationId !== id,
        ),
      })),
    });
  }

  createComorbidity(input: CreateComorbidityInput): Comorbidity {
    const comorbidity: Comorbidity = {
      id: this.createId(),
      name: input.name.trim(),
      medicationInteractionIds: this.uniqueMedicationIds(input.medicationInteractionIds),
      createdAt: new Date().toISOString(),
    };

    this.updateState({
      ...this.state(),
      comorbidities: [...this.state().comorbidities, comorbidity],
    });

    return comorbidity;
  }

  getComorbidity(id: string): Comorbidity | undefined {
    return this.state().comorbidities.find((comorbidity) => comorbidity.id === id);
  }

  updateComorbidity(id: string, input: CreateComorbidityInput): Comorbidity | undefined {
    const existingComorbidity = this.getComorbidity(id);

    if (!existingComorbidity) {
      return undefined;
    }

    const updatedComorbidity: Comorbidity = {
      ...existingComorbidity,
      name: input.name.trim(),
      medicationInteractionIds: this.uniqueMedicationIds(input.medicationInteractionIds),
    };

    this.updateState({
      ...this.state(),
      comorbidities: this.state().comorbidities.map((comorbidity) =>
        comorbidity.id === id ? updatedComorbidity : comorbidity,
      ),
    });

    return updatedComorbidity;
  }

  searchComorbidities(term: string): Comorbidity[] {
    const query = this.normalize(term);

    if (!query) {
      return this.state().comorbidities;
    }

    return this.state().comorbidities.filter((comorbidity) =>
      this.normalize(comorbidity.name).includes(query),
    );
  }

  deleteComorbidity(id: string): void {
    this.updateState({
      ...this.state(),
      comorbidities: this.state().comorbidities.filter((comorbidity) => comorbidity.id !== id),
    });
  }

  getInteractionMedications(comorbidity: Comorbidity): Medication[] {
    const medicationById = new Map(
      this.state().medications.map((medication) => [medication.id, medication]),
    );

    return comorbidity.medicationInteractionIds.flatMap((medicationId) => {
      const medication = medicationById.get(medicationId);
      return medication ? [medication] : [];
    });
  }

  private uniqueMedicationIds(ids: string[]): string[] {
    const existingMedicationIds = new Set(
      this.state().medications.map((medication) => medication.id),
    );
    const uniqueIds: string[] = [];

    for (const id of ids) {
      if (existingMedicationIds.has(id) && !uniqueIds.includes(id)) {
        uniqueIds.push(id);
      }
    }

    return uniqueIds;
  }

  private updateState(nextState: TemporaryClinicalRecordsState): void {
    this.state.set(nextState);
    this.writeState(nextState);
  }

  private readInitialState(): TemporaryClinicalRecordsState {
    const fallback: TemporaryClinicalRecordsState = {
      medications: [],
      comorbidities: [],
    };

    try {
      const rawState = globalThis.localStorage?.getItem(STORAGE_KEY);

      if (!rawState) {
        return fallback;
      }

      const parsedState = JSON.parse(rawState) as Partial<TemporaryClinicalRecordsState>;

      return {
        medications: Array.isArray(parsedState.medications) ? parsedState.medications : [],
        comorbidities: Array.isArray(parsedState.comorbidities) ? parsedState.comorbidities : [],
      };
    } catch {
      return fallback;
    }
  }

  private writeState(state: TemporaryClinicalRecordsState): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      return;
    }
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('pt-BR')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  private createId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }
}
