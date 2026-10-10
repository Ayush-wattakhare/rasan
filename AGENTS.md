<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Documentation, Plans & Change History Guidelines

## 1. Documentation & Change Log Maintenance
Whenever you work on any feature, bug fix, styling update, or refactoring task in the project:
- **Location:** Always check for a `docs/` folder in the root of the project. If it does not exist, create it.
- **File Name:** Maintain and update `docs/CHANGES_LOG.md` (and update any relevant plan files in `docs/`).

## 2. Mandatory Entry Format
For every task or change you undertake, append or update a dated entry using this exact format:

### [YYYY-MM-DD] - <Brief Title of Task or Feature>
- **Date & Time:** <Current Date and Time>
- **Objective:** <1-2 sentences explaining what was requested and why>
- **Implementation Plan:**
  1. <Step 1 of the plan>
  2. <Step 2 of the plan>
  3. <Step 3 of the plan>
- **Files Modified / Created:**
  - `path/to/file1.ext` - <Brief summary of what was changed>
  - `path/to/file2.ext` - <Brief summary of what was changed>
- **Status:** <Planning / In Progress / Completed>
- **Verification / Testing:** <Build, lint, typecheck, or manual test results>

## 3. Workflow Protocol
1. **Before writing code:** Review the current plan in `docs/` and log the intended plan steps.
2. **After completing the task:** Update the entry with all files modified, set Status to `Completed`, and record verification results.
3. **Preserve History:** Never erase past dated records; always maintain entries in reverse chronological order (newest on top).
