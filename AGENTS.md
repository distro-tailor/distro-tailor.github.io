# Agent Instructions & Guidelines for DistroTailor

This document provides system guidelines and mandatory invariants for AI coding assistants (Antigravity, Claude, Cursor, Copilot) operating in the DistroTailor codebase.

---

## ⚡ Core Rules & Invariants for AI Agents

### 1. Behavior-Driven Development (BDD) First
- **Always verify and update specifications in `specs/`:**
  - Before making functional changes or after resolving bugs/features, check the corresponding `.feature` file in `specs/`.
  - If a feature is new or modified, update or add a Gherkin scenario (`Given / When / Then`) to preserve living documentation parity.

### 2. Mandatory Automated Unit Testing
- **100% Test Coverage for Changes:**
  - Every new feature, utility, data catalog, or bug fix MUST include automated unit tests (`*.test.ts`).
  - Unit tests use native Node test runner (`node --test`) or `tsx --test`.
  - Always execute `npm test` before concluding your turn to verify zero regressions.

### 3. Client-Side MVC & Web Standards Architecture
- **Do NOT introduce frontend frameworks (No React, Angular, Vue):**
  - DistroTailor's web app runs on native Web Standards and Client-Side MVC.
  - Follow the formal contracts in [`packages/web/src/types.ts`](file:///Users/surenrao/Projects/distro-tailor/packages/web/src/types.ts):
    - `IAppStore`: Unidirectional reactive state extending W3C `EventTarget`.
    - `IAppRouter`: History depth, bi-directional URL persistence, loop guard.
    - `ViewRenderer`: Pure declarative HTML string renderers with zero DOM side effects.
    - `EventBinder`: Centralized event listener binding in `packages/web/src/handlers/events.ts`.
- **Zero Hardcoding in Templates or Handlers:**
  - Extract catalogs, suggestion combos, and dictionaries into `packages/web/src/data/*.ts`.
  - Never inline switch-case catalogs or static dictionaries inside view render functions.

### 4. Code Quality & Build Verification
- Always execute format and build checks:
  ```bash
  npm run build
  npm test
  ```
- Strict TypeScript: Never suppress compiler or linter errors silently. Avoid loose `any` casts.

### 5. Git Commit & Push Invariant
- Commit changes cleanly and atomically with Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- **CRITICAL INVARIANT:** **NEVER execute `git push` unless explicitly asked by the user.** Keep all commits local.
