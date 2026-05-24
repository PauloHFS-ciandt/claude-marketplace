---
description: "Creates a database migration and corresponding model for the project's backend. Reads ORM type (Sequelize/Prisma/TypeORM) from CLAUDE.md and generates the appropriate files. Use when the user asks to create a migration, add a table, or modify the schema."
---

# /create-migration — Database Migration Generator

You create database migrations and corresponding model files based on the project's ORM.

## Step 1: Read Project Context

Read `CLAUDE.md` to determine:
- **ORM type**: Sequelize, Prisma, TypeORM, Knex, Drizzle, or other
- **Database**: PostgreSQL, MySQL, MongoDB, SQLite
- **Backend path**: the working directory for the backend sub-project
- **Migration path**: where migrations live (e.g., `src/database/migrations/`)
- **Model path**: where models live (e.g., `src/app/models/`)
- **Naming conventions**: snake_case columns? camelCase fields? underscored?
- **Package manager**: yarn, npm, pnpm

If the CLAUDE.md doesn't specify these, explore the codebase:
- Look for `.sequelizerc`, `prisma/schema.prisma`, `ormconfig.ts`, `drizzle.config.ts`
- Read existing migrations and models to infer patterns

## Step 2: Collect Column Definitions

Ask the user:
1. Table/model name
2. Columns: name, type, nullable?, default value, references (foreign key)?

Use `AskUserQuestion` for common choices:
- Column types: STRING, INTEGER, BOOLEAN, DATE, TEXT, FLOAT, DECIMAL, JSON, UUID, ENUM
- Special columns: id (auto), timestamps (createdAt/updatedAt), soft delete (deletedAt)

## Step 3: Generate Migration

### For Sequelize

```javascript
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("{table_name}", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // ... columns from step 2
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("{table_name}");
  },
};
```

**File naming**: `YYYYMMDDHHMMSS-create-{table-name}.js`
**Location**: Read from CLAUDE.md or `.sequelizerc`

### For Prisma

Add to `prisma/schema.prisma`:
```prisma
model {ModelName} {
  id        Int      @id @default(autoincrement())
  // ... columns
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("{table_name}")
}
```

Then tell the user to run: `npx prisma migrate dev --name create-{table-name}`

### For TypeORM

Create entity file and migration using TypeORM CLI conventions.

## Step 4: Generate Model

Create the corresponding model class following existing patterns in the codebase.

- Read an existing model to match the exact pattern (imports, class structure, associations style)
- Follow the project's naming conventions
- Include TypeScript types if the project uses TS

## Step 5: Run Migration

Ask the user if they want to run the migration now:
- Sequelize: `{package_manager} migrate` or `npx sequelize-cli db:migrate`
- Prisma: `npx prisma migrate dev`
- TypeORM: `npx typeorm migration:run`

## Rules

- NEVER modify existing migrations — always create new ones
- ALWAYS include rollback logic (down migration)
- ALWAYS add indexes for foreign keys
- ALWAYS use the project's existing naming conventions (read from existing files)
- If unsure about a convention, read 2-3 existing migrations first
