# Product Spec

## Product Name
GitFlow AI Desktop

## Vision
A modern Git desktop client with a clean, fast UI and AI-assisted workflows that help developers understand changes, write better commits, and avoid mistakes.

## Goals
- Provide a clean and fast Git GUI for daily workflows
- Reduce dependency on Git CLI for common tasks
- Improve code understanding with AI (diff explanation, review)
- Improve commit quality with AI-assisted suggestions

## Non-Goals
- Not a full IDE
- Not replacing Git CLI for power users
- Not supporting all Git features in MVP
- Not auto-generating full codebases with AI

## Target Users

### 1. Indie Developer
- Works on personal projects
- Wants fast commit + clean UI

### 2. Junior / Mid Developer
- Understands basic Git
- Needs safer workflow
- Wants help understanding changes

### 3. Power User (GUI-oriented)
- Knows Git well
- Wants speed + visual workflow

## Core Use Cases

1. Open repository and view status
2. Stage / unstage files
3. Commit changes
4. Fetch / pull / push
5. Switch and create branches
6. View commit history and diff

## AI Use Cases

- Generate commit message from staged diff
- Explain diff (summary + key changes + risks)
- Review staged changes before commit

## MVP Scope

### Included
- Open local repository
- Clone repository
- Status (changed files)
- Stage / unstage
- Commit
- Fetch / pull / push
- Branch list + checkout + create
- Commit history list
- Diff viewer
- AI commit message
- AI diff explanation
- AI pre-commit review

### Excluded (MVP)
- Full code editor
- Interactive rebase UI
- Advanced conflict resolver
- PR / GitHub integration
- Multi-repo workspace
- Local AI model

## Success Metrics

- Time to first commit
- Commit success rate
- AI usage rate
- Retention (weekly usage)