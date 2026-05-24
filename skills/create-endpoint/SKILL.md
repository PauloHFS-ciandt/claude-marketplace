---
description: "Creates a new REST endpoint for the project's backend. Generates controller, route registration, and test skeleton following the project's architecture patterns. Reads framework (Express/Fastify/NestJS) from CLAUDE.md."
---

# /create-endpoint — REST Endpoint Generator

You create new REST endpoints following the project's established architecture.

## Step 1: Read Project Context

Read `CLAUDE.md` to determine:
- **Framework**: Express, Fastify, NestJS, Koa, or other
- **Architecture**: Clean Architecture (Controller -> UseCase -> Repository -> Model) or other
- **Backend path**: working directory
- **Route file location**: where routes are registered
- **Controller path**: where controllers live
- **Test path**: where tests live
- **Validation library**: Yup, Zod, Joi, class-validator
- **Auth middleware**: how auth is handled

If not in CLAUDE.md, explore the codebase:
- Read the main route file to understand registration patterns
- Read 1-2 existing controllers to understand the exact pattern
- Read existing tests to understand the test setup

## Step 2: Collect Endpoint Details

Ask the user:
1. HTTP method (GET / POST / PUT / PATCH / DELETE)
2. Route path (e.g., `/users/:id/profile`)
3. Brief description of what it does
4. Auth required? (public / authenticated / admin)
5. Request body/params/query structure

## Step 3: Explore Existing Patterns

Before generating, READ at least 2 existing files:
- One controller that does similar work
- The main route file to see registration pattern
- One test file to match test setup

This is critical — you must match the exact style of the existing codebase.

## Step 4: Generate Controller

Create the controller file matching the project's pattern. Example for Express Clean Architecture:

```javascript
class {ResourceName}Controller {
  async {methodName}(req, res) {
    // 1. Extract and validate input
    // 2. Call use case / service
    // 3. Return response
  }
}

export default new {ResourceName}Controller();
```

Adapt to the actual pattern in the codebase (class vs function, singleton vs DI, etc.)

## Step 5: Generate Use Case (if applicable)

If the project uses Clean Architecture with use cases:

```javascript
class {ActionName}UseCase {
  async execute({ /* params */ }) {
    // Business logic here
  }
}

export default new {ActionName}UseCase();
```

## Step 6: Register Route

Add the route to the appropriate route file:
- Read the existing route file
- Add the new route following the same pattern
- Apply the correct middleware (auth, validation, rate limiting)

## Step 7: Generate Test

Create a test file matching the project's test patterns:

```javascript
describe("{MethodName} {Route}", () => {
  it("should {expected behavior}", async () => {
    // Arrange
    // Act
    // Assert
  });

  it("should return 401 if not authenticated", async () => {
    // Auth guard test (if endpoint requires auth)
  });

  it("should return 400 for invalid input", async () => {
    // Validation test
  });
});
```

## Step 8: Validation Schema (if applicable)

If the project uses request validation (Yup, Zod, Joi), generate the schema:

```javascript
const schema = yup.object({
  // fields from step 2
});
```

## Rules

- ALWAYS read existing patterns before generating — never guess the architecture
- ALWAYS create tests alongside the endpoint
- ALWAYS validate input at the controller level
- ALWAYS use the project's existing auth middleware
- NEVER hardcode user identity — use auth middleware context (req.userId, etc.)
- NEVER expose internal errors to the client
- Follow the project's response format (read from existing controllers)
