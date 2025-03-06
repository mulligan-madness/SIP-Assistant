# SIP Assistant Refactoring

This directory contains documentation related to the ongoing refactoring efforts for the SIP Assistant project.

## ⚠️ PROGRESS TRACKING INSTRUCTIONS - MANDATORY FOR ALL CONTRIBUTORS ⚠️

**ALL CHAT SESSIONS AND CONTRIBUTORS MUST FOLLOW THESE INSTRUCTIONS:**

1. **Use the [Refactoring Plan](./refactoring-plan.md) as the primary tracking document**
2. **When completing tasks:**
   - Mark tasks as completed: `- [x] Task description - Completed by @username on YYYY-MM-DD`
   - Add details about implementation below the task (indented)
   - Update the "Last updated" date at the bottom of the document
3. **When starting tasks:**
   - Mark tasks as in progress: `- [-] Task description - In progress by @username since YYYY-MM-DD`
4. **Always maintain the standardized format**

Example of correctly formatted progress updates:
```markdown
- [x] Completed task - Completed by @username on YYYY-MM-DD
    - Note: Additional implementation details here
- [-] Task in progress - In progress by @username since YYYY-MM-DD
- [ ] Pending task
```

**ALL CHAT SESSIONS MUST READ AND COMPLY WITH THESE INSTRUCTIONS**

## Available Documents

- [Refactoring Plan](./refactoring-plan.md) - The comprehensive plan for refactoring the SIP Assistant codebase, including task tracking
- [Jest to Vitest Migration](./jest-to-vitest-migration.md) - Documentation of the migration from Jest to Vitest
- [Test Directory Consolidation](./test-directory-consolidation.md) - Documentation of the test directory consolidation

## Refactoring Approach

Our refactoring follows a **code-first approach**:

1. First, implement structural code changes
2. Then update tests to match the new structure
3. Use updated tests to validate refactored code

This approach is more efficient than fixing tests before refactoring code, as it prevents duplicated work and ensures tests target the final codebase structure.

## Best Practices

All refactoring work should adhere to the best practices documented in the [best-practices](../best-practices/) directory:

- [Code Organization](../best-practices/code-organization.md)
- [Component Design](../best-practices/component-design.md)
- [Backend Architecture](../best-practices/backend-architecture.md)
- [Testing](../best-practices/testing.md)
- [LLM Integration](../best-practices/llm-integration.md)

## Contributing to Refactoring

When contributing to the refactoring effort:

1. **Reference the plan**: Consult the [Refactoring Plan](./refactoring-plan.md) to understand the overall strategy
2. **Update progress**: Mark completed tasks in the plan document following the progress tracking instructions
3. **Document decisions**: Create new documents for significant architectural decisions
4. **Follow guidelines**: Adhere to the implementation guidelines in the plan

## Current Focus

The current refactoring focus is on **Phase 2: Directory Structure Reorganization**. See the [Refactoring Plan](./refactoring-plan.md) for details.

---

*Last updated: 2024-03-06* 