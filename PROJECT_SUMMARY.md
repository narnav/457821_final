## 1. Project Overview (What is Lumo?)
Lumo is an AI-powered programming mentor for absolute beginners. It pairs a structured Python-basics curriculum (`curriculum/v1`) with a FastAPI backend and a Next.js frontend to deliver guidance, hints, and practice flows. The intent is to teach learners how to think like programmers through mentorship and structured exercises, not by handing out solutions.

## 2. Core Philosophy (Non-negotiables)
- Guidance over answers: the mentor nudges with hints and questions, never full solutions.
- Curriculum as data: learning paths live in Markdown/YAML, keeping pedagogy editable and testable.
- Deterministic safety first: rule-based diagnostics and hints precede any LLM use.
- Beginner-first tone: supportive, calm, and focused on reasoning and confidence-building.
- Premium, minimal UX: dark, quiet visual language with motion only when it clarifies state changes (`DESIGN_SYSTEM.md`).

## 3. Backend Architecture
### Key folders and responsibilities
- `backend/app/main.py`: FastAPI app factory, CORS, health/root/docs endpoints, lifecycle logging, curriculum preflight.
- `backend/app/api/mentor.py`: Mentor endpoints (`/modules`, `/next-exercise`, `/hint`) orchestrating curriculum lookup, diagnostics, and hint generation.
- `backend/app/core/`: Business logic—`curriculum_loader.py` (YAML loader/validator), `diagnostics.py` (normalized code analysis), `hint_policy.py` (rule-based hints), `exercise_selector.py` (deterministic exercise pick), `logging.py` (logging config).
- `backend/app/models/`: Pydantic schemas for curriculum structures and mentor requests/responses.
- `backend/app/providers/`: Provider abstraction (`base.py`) with implementations for mock, Ollama, and Gemini; currently only the mock is used.
- `curriculum/v1/`: Python basics curriculum definitions in YAML plus human-readable specs/examples in Markdown.

### Diagnostics pipeline
- `analyze_code` in `backend/app/core/diagnostics.py` runs a staged pipeline: syntax check via `compile`, Pyright static analysis (authoritative when available), regex heuristics for common beginner mistakes, and AST scans for patterns like bare `except` or mutable defaults.
- Diagnostics are normalized into language-agnostic `DiagnosticCode` enums with severity, location, and source metadata; deduped and capped to 10 entries.
- Pyright rule/message mappings convert tool-specific output to normalized codes, enabling consistent policy handling across languages in the future.

### Hint generation logic
- `/hint` validates the exercise, runs diagnostics on learner input, and applies `policy_hint` (deterministic hint table keyed by `DiagnosticCode` in `hint_policy.py`).
- If any diagnostic is present, the policy response is authoritative and returned immediately (encouragement + next action included).
- Only when no issues are detected does the flow fall back to an AI provider, passing module context and normalized diagnostic metadata for safe prompt construction.

### AI provider usage
- Dependency injection currently always returns `MockProvider`; `Settings.ai_provider` is logged but not yet used for selection.
- `OllamaProvider` and `GeminiProvider` implement JSON-constrained prompt flows with guardrails (short hints, no code blocks) and error handling, but are not wired into routing.
- `ProviderConfig` centralizes model name, temperature, tokens, and endpoints; demo-mode friendliness via `Settings.is_demo_mode` favors the mock path.

## 4. Frontend Architecture
### Pages
- Landing (`src/app/page.tsx`): narrative hero → features → philosophy → CTA using Lenis + GSAP/ScrollTrigger for scroll choreography and shared `Navigation`.
- Learn (`src/app/learn/page.tsx`): three-column layout (exercise context, Monaco editor, mentor panel) with toolbar controls; uses mock exercise data and simulated mentor responses.
- Dashboard (`src/app/dashboard/page.tsx`): module list/progress cards with a “continue” CTA; data is static and not API-backed.

### Design system
- Global CSS variables in `src/app/globals.css` encode the dark theme, accent palette, radii, spacing, motion timings, and inline Tailwind theme extensions; fonts are Inter and JetBrains Mono.
- Reusable primitives (`components/ui/button.tsx`, `card.tsx`, `navigation.tsx`) and design references in `DESIGN_SYSTEM.md` enforce the premium, calm aesthetic.
- Monaco editor is themed (`lumo-dark`) to match the surface palette and typography.

### UX principles
- Code-first layouts: the editor dominates the learn view; side panels are supportive and quiet.
- Motion is purposeful: framer-motion for state changes, GSAP for scroll reveals, Lenis for smooth scrolling; reduced-motion is honored.
- Mentor UI is not a chatbot stream—feedback appears as concise hint + next action, with a calm thinking indicator.

## 5. What is already implemented (bullet list)
- End-to-end FastAPI skeleton with mentor routes, settings, CORS, and health/docs endpoints.
- Curriculum data and schemas for a six-module Python basics path (`python_basic.yaml`, `python_basic.md`, `python_basic_examples.md`).
- Normalized diagnostics engine (syntax → Pyright → heuristics → AST) with standardized codes and deduplication.
- Deterministic hint policy covering common beginner issues, returning structured `MentorResponse`.
- AI provider abstractions plus mock, Ollama, and Gemini implementations; mock is active by default.
- Frontend screens for landing, learn workspace, and dashboard with shared navigation, button/card components, and Monaco-based editor.
- Design system variables and motion patterns aligned with `DESIGN_SYSTEM.md`, including accessibility accommodations for reduced motion.

## 6. What is intentionally NOT implemented yet (bullet list)
- Additional languages or paths beyond Python basics.
- Interview prep, competitive programming tracks, or adaptive difficulty beyond the outlined curriculum.
- RAG/knowledge systems, heavy ML pipelines, or fine-tuning; planned code analysis service (Go + Tree-Sitter) is not present.
- Production-grade sandboxing or secure execution; exercises avoid advanced frameworks within the curriculum.
- API-based LLM fallback and provider selection are stubbed to mock pending configuration and runtime support.

## 7. Current strengths of the project
- Clear product vision and pedagogy captured in README and curriculum data.
- Robust diagnostic normalization feeding a rule-based hint system that gates LLM usage.
- Modular provider layer with structured prompts designed to prevent solution leakage.
- Detailed design system guiding typography, color, and motion for a consistent premium feel.
- Frontend prototypes mirror the intended UX: code-centric learning flow, calm mentor responses, and minimal navigation.

## 8. Current weaknesses / technical debt
- Frontend uses static data; no integration with backend APIs for modules, exercises, or hints.
- Provider selection is hardcoded to the mock; Ollama/Gemini paths and settings are unused.
- No persistence layer or learner state tracking despite SQLModel in dependencies; exercise selection remains deterministic stub logic.
- No automated tests or coverage around diagnostics, hint policy, or API endpoints.
- No code execution or sandboxing path; health of Pyright dependency is best-effort with silent fallback.

## 9. Immediate next steps (prioritized)
1. Wire `ai_provider` settings into provider selection and add runtime configuration for Ollama/Gemini, including JSON validation and error surfacing.
2. Connect the learn and dashboard pages to backend endpoints for modules, next exercises, and hints; introduce lightweight state management for learner progress.
3. Persist learner state (SQLModel) and extend `ExerciseSelector` to honor completion/unlock rules and adaptive signals.
4. Add automated tests for `diagnostics.py`, `hint_policy.py`, and mentor API flows, ensuring diagnostic-to-hint coverage.
5. Plan the code execution/evaluation path (even if mocked) with a roadmap toward safer sandboxing in later phases.
