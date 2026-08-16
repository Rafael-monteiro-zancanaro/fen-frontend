# Pacientes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement patient listing, create, view, edit, comorbidity associations, and pharmaceutical-service interaction warnings.

**Architecture:** Reuse the existing temporary local stores and extract the patient identification form from pharmaceutical services into a shared standalone component. Store patient-comorbidity relationships by comorbidity ids and compute medication warnings from the existing comorbidity-to-medication interaction ids.

**Tech Stack:** Angular standalone components, template-driven forms, signals/computed, Vitest, existing Tailwind CSS 4 and semantic Design System classes.

---

## File Structure

- Modify `src/app/domain/clinical-records.ts`: add patient comorbidity ids.
- Modify `src/app/domain/temporary-pharmaceutical-service-store.ts`: expose patient CRUD/search/comorbidity helpers and preserve CPF upsert behavior.
- Modify `src/app/domain/temporary-pharmaceutical-service-store.spec.ts`: test patient CRUD, duplicate CPF handling, comorbidity associations, and medication interaction lookups.
- Create `src/app/components/patient-form/patient-form.ts` and `.html`: shared patient fields, masks, CPF lookup, ViaCEP, and validation display.
- Create `src/app/pages/pacientes-page/*`: list patients with search and pagination.
- Create `src/app/pages/novo-paciente-page/*`: create/edit patient and manage comorbidities after a patient exists.
- Create `src/app/pages/visualizar-paciente-page/*`: read-only patient details and comorbidities.
- Modify `src/app/pages/servicos-farmaceuticos-page/*`: use shared patient form, load selected patient comorbidities, and show non-blocking danger alerts for medication-comorbidity interactions.
- Modify `src/app/app.routes.ts`, `src/app/app.html`, and `src/app/app.ts`: add patient routes and navigation.
- Modify `src/app/app.spec.ts`: route-level tests for patient flows and interaction warnings.

## Tasks

### Task 1: Patient Store Behavior

- [ ] Add failing tests for patient creation, update, search by name/CPF, duplicate CPF reuse, comorbidity id uniqueness, and medication interaction matching.
- [ ] Run `npm test -- --run src/app/domain/temporary-pharmaceutical-service-store.spec.ts` and confirm failures.
- [ ] Implement patient store methods and model fields.
- [ ] Re-run the focused store test.

### Task 2: Shared Patient Form

- [ ] Add app-level tests that assert the service form still renders CPF/name/CEP fields and masks values.
- [ ] Create `PatientForm` from the existing step 1 markup and handlers.
- [ ] Replace the inline step 1 markup with `app-patient-form`.
- [ ] Re-run `npm test -- --run src/app/app.spec.ts`.

### Task 3: Patient Pages

- [ ] Add failing route-level tests for `/pacientes`, empty state, search, pagination, create, view, edit, and duplicate CPF feedback.
- [ ] Implement list, create/edit, view pages using existing table, pagination, card, empty, attachment, and alert classes.
- [ ] Integrate routes and nav.
- [ ] Re-run `npm test -- --run src/app/app.spec.ts`.

### Task 4: Patient Comorbidities

- [ ] Add failing tests for searchable comorbidity association, duplicate prevention, removal, and read-only viewing.
- [ ] Implement comorbidity association UI on persisted patient pages.
- [ ] Re-run focused app tests.

### Task 5: Pharmaceutical Service Warnings

- [ ] Add failing tests for loading patient comorbidities on CPF lookup and warning below medication fields in steps 3, 4, and 5.
- [ ] Implement computed warning lookup from selected medication id and patient comorbidity ids.
- [ ] Render non-blocking `alert alert-danger` messages with real medication and comorbidity names.
- [ ] Re-run focused app tests.

### Task 6: Verification

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Review changed files for scope and report any verification failures.
