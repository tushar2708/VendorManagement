# Audit Mode

Diagnose and fix an existing Mixpanel implementation.

## Step 1 — Diagnose Current State

1. **Events** — Review existing events in Lexicon. Check naming consistency, descriptions, volume patterns.
2. **Identity** — Are `identify()` and `reset()` placed correctly? Is `identify()` called on app re-open?
3. **Tracking plan** — Does one exist? Are all planned events implemented? Gaps?
4. **Common issues:**
   - Duplicate events (same action, different names)
   - Inconsistent naming (camelCase vs snake_case, past vs present tense)
   - Missing super properties
   - Numeric values sent as strings (non-aggregatable)
   - Dynamic event names (creates thousands of unique names)
   - Events fired before consent gate
5. **Compliance** — Is consent gated if EU/CA users exist?

## Step 2 — Prioritize Fixes

| Severity | Examples |
|---|---|
| **Critical** (data corruption) | Identity bugs, consent violations, wrong ID merge mode |
| **High** (data quality) | Duplicate events, naming inconsistencies, missing properties |
| **Medium** (maintainability) | Missing Lexicon descriptions, no governance process |
| **Low** (optimization) | Missing super properties, suboptimal tracking method |

## Step 3 — Execute Fixes

- Individual event fixes → use Add Tracking mode
- Structural overhaul → use Full Implementation mode
- Naming cleanup → use Lexicon merge feature (select both events → Merge → choose canonical name)

## Step 4 — Report

Present a summary table with all findings, severity, and fix status.
