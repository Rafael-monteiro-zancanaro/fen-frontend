# Medicamentos e Comorbidades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build functional frontend flows for medications and comorbidities.

**Architecture:** Add a temporary local repository service with domain types, backed by `localStorage`, then add standalone Angular pages for list/create/view flows. Integrate routes and the existing header navigation without adding new UI libraries.

**Tech Stack:** Angular 22 standalone components, Angular forms, Angular router, signals/computed, Vitest, Tailwind CSS 4 plus the existing semantic Design System classes.

---

## File Structure

- Create `src/app/domain/clinical-records.ts`: domain types for medications and comorbidities.
- Create `src/app/domain/temporary-clinical-records-store.ts`: temporary local data service with CRUD/search helpers.
- Create `src/app/domain/temporary-clinical-records-store.spec.ts`: focused tests for data behavior and duplicate interaction protection.
- Modify `src/app/app.routes.ts`: add medication and comorbidity routes.
- Modify `src/app/app.html`: add nav links using the existing header structure.
- Modify `src/app/app.ts`: include new routes in internal navigation detection.
- Create pages under `src/app/pages/*`: medication list/create/view and comorbidity list/create/view.
- Modify `src/app/app.spec.ts`: route-level behavior tests for the new flows.

## Tasks

### Task 1: Temporary Domain Store

- [ ] Write failing tests in `src/app/domain/temporary-clinical-records-store.spec.ts` for create/search/delete medications, create/search/delete comorbidities, and duplicate interaction filtering.
- [ ] Run `npm test -- --run src/app/domain/temporary-clinical-records-store.spec.ts` and confirm it fails because the store does not exist.
- [ ] Create `clinical-records.ts` and `temporary-clinical-records-store.ts` with signal-backed state persisted to `localStorage`.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Routes and Navigation

- [ ] Add failing route/nav expectations to `src/app/app.spec.ts` for `/medicamentos` and `/comorbidades`.
- [ ] Run `npm test -- --run src/app/app.spec.ts` and confirm failures for missing routes/nav.
- [ ] Update `app.routes.ts`, `app.html`, and `app.ts`.
- [ ] Re-run `npm test -- --run src/app/app.spec.ts`.

### Task 3: Medication Pages

- [ ] Add failing tests for medication empty list, create form validation, successful create, view page, search and delete confirmation.
- [ ] Run `npm test -- --run src/app/app.spec.ts` and confirm failures for missing UI behavior.
- [ ] Implement `medicamentos-page`, `novo-medicamento-page`, and `visualizar-medicamento-page`.
- [ ] Re-run `npm test -- --run src/app/app.spec.ts`.

### Task 4: Comorbidity Pages

- [ ] Add failing tests for comorbidity empty list, create form validation, medication search/add/remove interactions, duplicate blocking, view page and delete confirmation.
- [ ] Run `npm test -- --run src/app/app.spec.ts` and confirm failures for missing UI behavior.
- [ ] Implement `comorbidades-page`, `nova-comorbidade-page`, and `visualizar-comorbidade-page`.
- [ ] Re-run `npm test -- --run src/app/app.spec.ts`.

### Task 5: Full Verification

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Review `git diff --stat` and ensure changes are scoped to the approved modules and plan/spec docs.
