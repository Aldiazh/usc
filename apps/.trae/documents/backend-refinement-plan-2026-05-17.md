# Backend Refinement Plan

## Summary

This plan focuses on **reliability-first MVP stabilization** for the Laravel backend in `c:\Users\senku\Documents\usc\info-clash\apps\backend`. The backend already covers the core product loop: admin auth, question management, event management, participant join, live gameplay, and websocket broadcasts. The main refinement need is not a new architecture, but tightening correctness, data integrity, operational setup, and test coverage so the current product behaves consistently under real usage.

The highest-value backend work is:

1. enforce gameplay invariants server-side
2. make state-changing workflows transactional and race-safe
3. normalize validation and API contracts
4. fix schema/setup issues that can break fresh environments
5. add focused feature coverage for the current game loop

## Current State Analysis

### Repo shape

- Monorepo with:
  - backend: Laravel 12 API in `backend/`
  - frontend: React/Vite SPA in `frontend/`
- Backend entrypoints and wiring:
  - `backend/public/index.php`
  - `backend/bootstrap/app.php`
  - `backend/routes/api.php`
- Core backend layers:
  - controllers in `backend/app/Http/Controllers/`
  - requests in `backend/app/Http/Requests/`
  - services in `backend/app/Services/`
  - models in `backend/app/Models/`
  - broadcast events in `backend/app/Events/`

### What already exists

- Sanctum-based admin auth:
  - `backend/app/Http/Controllers/Auth/AuthController.php`
  - `backend/app/Services/AuthService.php`
- Event and question CRUD:
  - `backend/app/Http/Controllers/Admin/EventController.php`
  - `backend/app/Http/Controllers/Admin/QuestionController.php`
  - `backend/app/Services/EventService.php`
  - `backend/app/Services/QuestionService.php`
- Participant join and game actions:
  - `backend/app/Http/Controllers/Participant/ParticipantController.php`
  - `backend/app/Http/Controllers/Participant/GamePlayController.php`
  - `backend/app/Services/ParticipantService.php`
  - `backend/app/Services/GameService.php`
- Realtime events with Reverb:
  - `backend/app/Events/LobbyUpdated.php`
  - `backend/app/Events/QuestionStarted.php`
  - `backend/app/Events/QuestionEnded.php`
  - `backend/app/Events/GameEnded.php`

### Current backend risks and gaps

1. **Gameplay correctness is under-enforced**
   - `backend/app/Http/Controllers/Participant/GamePlayController.php` accepts any `event_question_id` that exists.
   - `backend/app/Services/GameService.php` does not verify that:
     - the participant belongs to the same event as the submitted question
     - the submitted question is the current live question
     - the event is currently accepting answers
     - the participant is still an active player
   - Result: cross-event answers, stale/future question answers, and invalid submissions can slip through.

2. **State-changing workflows are not transactional**
   - `backend/app/Services/EventService.php` question attachment is multi-write without transaction protection.
   - `backend/app/Services/GameService.php` answer creation and score increment are separate writes.
   - `backend/app/Services/ParticipantService.php` join capacity check is count-then-create, which is race-prone.
   - `backend/app/Services/ParticipantService.php` ranking updates save each participant during a read-oriented method.
   - Result: partial updates, race conditions, and inconsistent state under concurrent use.

3. **Fresh setup has a migration conflict**
   - Both files create `personal_access_tokens`:
     - `backend/database/migrations/2019_12_14_000001_create_personal_access_tokens_table.php`
     - `backend/database/migrations/2026_05_17_142137_create_personal_access_tokens_table.php`
   - Result: fresh migrations are likely to fail or become environment-dependent.

4. **Realtime/dev setup is incomplete**
   - Frontend expects Reverb connectivity in:
     - `frontend/src/lib/echo.js`
     - `frontend/src/hooks/useGameSocket.js`
   - Backend `composer.json` `dev` script starts web, queue, logs, and vite, but not a Reverb server.
   - Result: local game flow can appear broken even when API endpoints work.

5. **Validation is inconsistent and thin in critical flows**
   - Create flows use Form Requests:
     - `backend/app/Http/Requests/StoreEventRequest.php`
     - `backend/app/Http/Requests/StoreQuestionRequest.php`
     - `backend/app/Http/Requests/JoinEventRequest.php`
     - `backend/app/Http/Requests/LoginRequest.php`
   - Update/import/game-control flows rely on inline controller validation:
     - `backend/app/Http/Controllers/Admin/EventController.php`
     - `backend/app/Http/Controllers/Admin/QuestionController.php`
     - `backend/app/Http/Controllers/Admin/GameController.php`
     - `backend/app/Http/Controllers/Participant/GamePlayController.php`
   - `QuestionController::import()` parses files but does not validate each row against the same rules as normal question creation.

6. **Broadcast authorization and channel strategy are minimal**
   - Broadcasts are sent on public channels like `event.{id}` in:
     - `backend/app/Events/LobbyUpdated.php`
     - `backend/app/Events/QuestionStarted.php`
   - `backend/routes/channels.php` only contains the Laravel default user example and no event-specific authorization logic.
   - Result: acceptable for a prototype, but weak for privacy/control if event IDs become guessable.

7. **Tests are effectively absent**
   - Only default placeholder tests exist:
     - `backend/tests/Feature/ExampleTest.php`
     - `backend/tests/Unit/ExampleTest.php`
   - Result: no regression safety around auth, event lifecycle, join flow, answer submission, elimination, or stats.

8. **Documentation is still framework boilerplate**
   - `backend/README.md` is the default Laravel README rather than project-specific setup and backend behavior documentation.

## Proposed Changes

### Phase 1: Repair backend baseline and environment setup

#### 1. Remove migration duplication and align setup docs

- Files:
  - `backend/database/migrations/2026_05_17_142137_create_personal_access_tokens_table.php`
  - `backend/README.md`
  - `backend/composer.json`
  - `backend/.env.example`
- What:
  - remove the duplicate Sanctum migration
  - document the intended backend startup flow, including API server, queue worker, and Reverb
  - update the local dev script if the project expects Reverb during normal development
- Why:
  - fresh environments should migrate cleanly and boot predictably
- How:
  - keep the original Sanctum migration and delete the later duplicate file
  - replace the Laravel boilerplate README with project-specific backend instructions
  - decide whether `composer dev` should include `php artisan reverb:start` or whether Reverb is intentionally externalized; document the chosen behavior explicitly

#### 2. Normalize environment assumptions

- Files:
  - `backend/.env.example`
  - `frontend/.env`
  - `frontend/src/lib/echo.js`
- What:
  - align websocket host/port assumptions between backend and frontend
  - verify the default local values are consistent with documented startup commands
- Why:
  - the current repo suggests mixed Docker/local assumptions (`REVERB_HOST=reverb` in backend env, `localhost` in frontend env)
- How:
  - document one supported local path first: fully local or Docker-backed
  - keep the env defaults internally consistent with that path

### Phase 2: Enforce gameplay invariants and state transitions

#### 3. Add request objects for gameplay and admin game control

- Files:
  - new requests under `backend/app/Http/Requests/`
  - `backend/app/Http/Controllers/Participant/GamePlayController.php`
  - `backend/app/Http/Controllers/Admin/GameController.php`
  - `backend/app/Http/Controllers/Admin/EventController.php`
  - `backend/app/Http/Controllers/Admin/QuestionController.php`
- What:
  - replace inline validation in critical mutation endpoints with dedicated Form Requests
- Why:
  - central validation rules are easier to audit, test, and evolve
- How:
  - introduce request classes for:
    - answer submission
    - elimination
    - event update
    - question update
    - question import
    - event status update / attach questions if kept as separate endpoints
  - move request shape validation out of controllers and keep controllers orchestration-only

#### 4. Harden answer submission rules in the service layer

- Files:
  - `backend/app/Services/GameService.php`
  - `backend/app/Http/Controllers/Participant/GamePlayController.php`
  - potentially `backend/app/Models/Event.php`
  - potentially `backend/app/Models/Participant.php`
- What:
  - reject invalid answer submissions even when the payload passes basic validation
- Why:
  - the service layer is the last trustworthy boundary for game rules
- How:
  - verify all of the following before creating an answer:
    - participant belongs to the event that owns the event-question
    - event status is `live`
    - participant role/status still allows answering
    - submitted `event_question_id` matches the current question for that event
    - only valid answer mode is used for the question type
  - return structured 4xx responses for rule violations rather than silent acceptance

#### 5. Centralize event lifecycle transitions

- Files:
  - `backend/app/Http/Controllers/Admin/GameController.php`
  - `backend/app/Services/EventService.php`
  - `backend/app/Services/GameService.php`
  - possibly new lifecycle helper/service if needed
- What:
  - move lifecycle mutations out of controllers and into a consistent service flow
- Why:
  - start, next-question, end-question, elimination, and end-game are all business transitions, not controller concerns
- How:
  - define allowed transitions explicitly, for example:
    - `draft -> lobby`
    - `lobby -> live`
    - `live -> paused|finished`
  - prevent invalid transitions such as starting without questions or advancing beyond the final question without a controlled end-state
  - keep broadcasting after state is successfully committed

### Phase 3: Make writes transactional and concurrency-safe

#### 6. Add transactions around multi-step mutations

- Files:
  - `backend/app/Services/GameService.php`
  - `backend/app/Services/ParticipantService.php`
  - `backend/app/Services/EventService.php`
- What:
  - wrap multi-write workflows in `DB::transaction()`
- Why:
  - current flows can partially succeed under error or concurrency
- How:
  - answer submission: create answer + update score atomically
  - join-by-pin: lock/check capacity + insert participant atomically
  - attach questions: update all event-question records atomically
  - elimination: update all eliminated participants within one transaction

#### 7. Handle duplicate-answer races explicitly

- Files:
  - `backend/app/Services/GameService.php`
  - `backend/database/migrations/2024_01_01_000006_create_answers_table.php`
- What:
  - rely on the existing unique constraint as the source of truth and make the service resilient to collision
- Why:
  - concurrent answer submissions can still bypass the initial existence check and throw a server error
- How:
  - keep the unique index
  - catch unique-constraint violations and return the existing answer or a stable conflict response
  - remove any logic that assumes the pre-insert lookup alone is sufficient

#### 8. Remove side effects from ranking reads

- Files:
  - `backend/app/Services/ParticipantService.php`
  - `backend/app/Http/Controllers/Admin/GameController.php`
  - `backend/app/Http/Controllers/Admin/ParticipantAdminController.php`
- What:
  - stop persisting `current_rank` during `getRanking()`
- Why:
  - the current method performs one save per participant during a read-like operation, which is slow and unpredictable
- How:
  - choose one of these implementation approaches and keep it consistent:
    - compute ranks at response time only for MVP stabilization
    - recalculate and persist ranks only at deliberate checkpoints such as question end / game end
  - for MVP stabilization, computing ranks on read is the lower-risk option

### Phase 4: Tighten API contracts and import quality

#### 9. Standardize API response shapes for admin and participant flows

- Files:
  - `backend/app/Http/Controllers/Admin/*.php`
  - `backend/app/Http/Controllers/Participant/*.php`
  - `backend/app/Http/Resources/*.php`
  - `frontend/src/lib/api.js`
  - `frontend/src/hooks/useGameSocket.js`
- What:
  - make response formats predictable for both success and validation/error cases
- Why:
  - the frontend already depends on several implicit payload shapes; stability helps prevent UI regressions
- How:
  - standardize returned resource wrappers or plain JSON formats per endpoint category
  - document the expected payloads for:
    - participant join
    - participant status
    - answer submission
    - game stats and scoreboard
    - admin event and question CRUD

#### 10. Validate imported questions before persistence

- Files:
  - `backend/app/Http/Controllers/Admin/QuestionController.php`
  - `backend/app/Services/QuestionService.php`
  - new import validation/request helper classes as needed
- What:
  - ensure imported rows follow the same domain rules as normal question creation
- Why:
  - the import path can currently create malformed or inconsistent question records
- How:
  - normalize parsed rows
  - validate each row against the shared question rules
  - decide whether import is all-or-nothing or partial-success with row-level errors
  - for MVP stabilization, use partial-success with a clear error report only if the UI needs batch recovery; otherwise all-or-nothing is simpler and safer

### Phase 5: Add focused regression coverage

#### 11. Replace placeholder tests with backend feature coverage

- Files:
  - `backend/tests/Feature/`
  - `backend/tests/Unit/`
  - `backend/tests/TestCase.php`
  - factories/seeders as needed under `backend/database/factories/` and `backend/database/seeders/`
- What:
  - add high-value feature tests around the current MVP loop
- Why:
  - this repo currently has no meaningful automated protection
- How:
  - prioritize tests for:
    - admin login/logout/me
    - event creation and question attachment
    - participant join by PIN
    - join rejection when event is full or invalid
    - answer submission for current vs non-current question
    - duplicate answer handling
    - elimination behavior
    - end-question and end-game stats/ranking outputs
  - keep unit tests lightweight unless utility logic is extracted from services

#### 12. Add smoke coverage for realtime-adjacent behavior without over-testing broadcasts

- Files:
  - `backend/tests/Feature/`
  - events/controllers involved in gameplay
- What:
  - verify that core endpoints dispatch expected broadcast events when state changes
- Why:
  - the game loop depends on broadcasts, but full websocket integration tests are heavier than needed for stabilization
- How:
  - fake events/broadcasts in Laravel tests and assert dispatch intent for:
    - participant join -> `LobbyUpdated`
    - game start / next question -> `QuestionStarted`
    - question end -> `QuestionEnded`
    - game end -> `GameEnded`

### Phase 6: Optional hardening backlog after MVP stabilization

#### 13. Revisit channel privacy and authorization

- Files:
  - `backend/app/Events/*.php`
  - `backend/routes/channels.php`
  - `frontend/src/lib/echo.js`
  - `frontend/src/hooks/useGameSocket.js`
- What:
  - evaluate whether `event.{id}` should remain a public channel
- Why:
  - current public channels are acceptable for a classroom/demo MVP but not ideal for controlled production events
- How:
  - if privacy becomes important, move to private/presence channels and introduce authorization for event membership/admin access
  - defer this until after correctness and test coverage are stable

## Assumptions And Decisions

- The immediate goal is **backend refinement**, not a broad full-stack redesign.
- The preferred target state is **MVP stabilization**, not a full production platform overhaul.
- PostgreSQL is the intended database for the backend, based on:
  - `backend/.env.example`
  - Postgres extensions in `backend/Dockerfile`
  - `ILIKE` usage in `backend/app/Services/QuestionService.php`
- The current controller/service split is good enough to keep; the refinement should strengthen boundaries rather than rewrite the app into a new architecture.
- Realtime remains part of the product scope because the frontend already listens to broadcast events.
- Security hardening beyond current MVP needs is secondary to correctness and reliability, except where it blocks safe gameplay behavior.

## Suggested Execution Order

1. fix the duplicate migration and replace backend setup docs
2. align Reverb/local environment startup expectations
3. add request classes for all critical mutation endpoints
4. harden `GameService` invariants and event lifecycle rules
5. add transactions and concurrency handling in services
6. clean up ranking/import behavior and normalize API contracts
7. add focused feature tests for the stabilized flows

## Verification Steps

After implementation, verify the backend with the following checks:

1. **Fresh setup**
   - run backend migrations from a clean database
   - confirm no duplicate migration failure occurs
   - confirm the documented local startup flow boots API, queue, and Reverb successfully

2. **Core API flow**
   - admin can log in and access `/api/auth/me`
   - admin can create questions and events, then attach questions to an event
   - participant can join a valid lobby by PIN

3. **Gameplay correctness**
   - participant can answer only the current question for their own event
   - duplicate submissions do not create duplicate answers or 500s
   - full events reject additional joins deterministically
   - invalid lifecycle transitions return clear 4xx responses

4. **Realtime behavior**
   - join emits `LobbyUpdated`
   - game start and next question emit `QuestionStarted`
   - question end emits `QuestionEnded`
   - game end emits `GameEnded`

5. **Automated tests**
   - backend test suite passes with meaningful feature coverage replacing placeholder tests
   - tests cover both happy path and key failure modes
