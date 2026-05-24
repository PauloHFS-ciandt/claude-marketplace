---
description: "Generates a Spec Driven Development (SDD) specification from an Azure DevOps work item. Includes metadata, acceptance criteria, BDD scenarios (Given/When/Then), and test template. Use when asked to generate a spec, write a spec, create BDD scenarios, or plan a work item."
---

# /generate-spec — SDD Spec Generator

You generate complete technical specifications following the Spec Driven Development pattern from Azure DevOps work items.

## Prerequisites

The Azure DevOps MCP server must be configured (the `ado` server from `@azure-devops/mcp`). If not available, tell the user to run `/einstein-workflow:setup-project` first.

## How to Use

The user provides a work item ID (e.g., "generate spec for #12345" or just "spec 12345").

## Step 1: Fetch Work Item

Use the Azure DevOps MCP tools to get the work item details:
- Get the work item by ID (title, description, acceptance criteria, state, type, assigned to, iteration)
- Get parent/child hierarchy if available (Epic -> Feature -> User Story -> Task)
- Get comments if they contain additional context

## Step 2: Generate the Spec

Write a markdown file to `specs/` (or the path specified by the user) with this structure:

```markdown
# Spec: {work_item_title}

## Metadata

| Field | Value |
|---|---|
| Work Item | #{id} |
| Type | {User Story / Bug / Task} |
| State | {state} |
| Sprint | {iteration} |
| Assigned To | {assigned_to} |
| Parent | #{parent_id} {parent_title} (if exists) |
| Generated | {date} |

## Description

{work_item_description — cleaned from HTML}

## Acceptance Criteria

{Parse from work item's acceptance criteria field. If HTML, convert to markdown checklist.}

- [ ] Criterion 1
- [ ] Criterion 2
- ...

## BDD Scenarios

### Scenario 1: {happy path}

```gherkin
Given {precondition}
When {action}
Then {expected result}
```

### Scenario 2: {error case}

```gherkin
Given {precondition}
When {invalid action}
Then {error handling}
```

### Scenario 3: {edge case}

```gherkin
Given {edge condition}
When {action}
Then {boundary behavior}
```

(Generate 3-5 scenarios covering: happy path, validation errors, edge cases, authorization)

## Technical Notes

{Based on the acceptance criteria and description, identify:}
- API endpoints affected
- Database changes needed (migrations?)
- UI components affected
- Integration points (external services, notifications)

## Test Template

```typescript
describe("{work_item_title}", () => {
  describe("Scenario 1: {happy path}", () => {
    it("should {expected behavior}", async () => {
      // Arrange: {precondition}
      // Act: {action}
      // Assert: {expected result}
    });
  });

  describe("Scenario 2: {error case}", () => {
    it("should {error handling}", async () => {
      // Arrange: {precondition}
      // Act: {invalid action}
      // Assert: {error result}
    });
  });
});
```
```

## Step 3: Sprint Batch Mode

If the user asks "generate specs for the sprint" or "spec the current sprint":

1. List work items in the current iteration using the MCP
2. Filter by type (User Stories and Bugs by default)
3. Check which ones already have specs in the `specs/` directory (match by work item ID in filename)
4. Generate specs only for missing ones
5. Report: "Generated X specs, Y already existed, Z total in sprint"

## File Naming

Specs are saved as: `specs/{id}-{kebab-case-title}.md`

Example: `specs/12345-add-jwt-authentication.md`

## Rules

- Always fetch the REAL work item data from Azure DevOps — never fabricate
- Parse HTML acceptance criteria into clean markdown
- Generate realistic BDD scenarios based on the actual requirements
- If the work item has no acceptance criteria, flag it: "This work item has no acceptance criteria defined. Consider adding them before implementation."
- Keep technical notes grounded in the project's actual stack (read from CLAUDE.md)
