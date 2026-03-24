# Technical Design

## Architecture

This project follows a modular monolith architecture:

- Presentation Layer (React)
- Application Layer (use-case orchestration)
- Domain Layer (models and business rules)
- Infrastructure Layer (Git CLI, filesystem, AI, OS)

## Tech Stack

- Desktop: Tauri
- Frontend: React + TypeScript + Vite
- Styling: Tailwind
- State: Zustand
- Async data: TanStack Query
- Backend: Rust
- Git engine: Git CLI
- AI: external API (initial phase)

## Responsibilities

### Frontend
- UI rendering
- user interaction
- state management
- panel layout
- async query handling

### Rust (Tauri backend)
- Git command execution
- filesystem operations
- parsing Git output
- AI request handling (optional)
- secure operations

## Module Structure

### Frontend
- features/
- entities/
- components/
- shared/
- store/

### Backend
- commands/
- domain/
- infrastructure/
- interfaces/
- state/

## Tauri Command Pattern

All backend calls must go through Tauri commands.

Example:
- open_repository
- get_status
- stage_files
- create_commit
- list_branches
- get_commit_history
- get_diff
- explain_diff
- review_changes

## Data Flow

1. User action in UI
2. Frontend calls Tauri command
3. Rust executes Git / AI
4. Rust returns typed DTO
5. Frontend updates state and UI

## Error Handling

All errors must follow a structured format:

- code
- message
- details (optional)
- recoverable (boolean)

## Key Rules

- UI must not call Git directly
- Rust handles all system interactions
- Git output must be parsed into structured models
- AI responses must be structured, not free text
- Do not mix domain logic into UI components