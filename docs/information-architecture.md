# Information Architecture

## Layout

The application uses a 3-column layout:

### Left Sidebar
- Repository navigation
- Branch list
- Working changes
- Quick access sections

### Center Panel
- Primary workspace
- Commit history
- Changed files
- Diff viewer

### Right Panel
- Commit details
- AI explanation
- AI review
- Contextual insights

## Navigation

- Top bar: repo selector, sync actions (fetch/pull/push)
- Sidebar: navigation between branches, changes, history
- Main panel: content based on selection

## Key Screens

### 1. Workspace (default)
- Changed files
- Commit panel

### 2. History
- Commit graph
- Commit list
- Commit detail

### 3. Diff
- File-level diff view

## AI Placement

AI is not a separate screen.

AI is embedded:

- In commit panel → commit message + review
- In diff panel → explanation
- In history → commit insight

## UX Principles

- Information-dense but readable
- Minimal clicks for common actions
- No hidden destructive actions
- Fast feedback for all operations
- Context preserved across actions