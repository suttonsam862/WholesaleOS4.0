# Testing Infrastructure

This document describes the testing strategy and infrastructure for the WholesaleOS application.

## Test Structure

```
tests/
├── setup.ts              # Global test configuration
├── unit/                 # Unit tests (fast, isolated)
├── integration/          # Integration tests (API, DB)
└── e2e/                  # End-to-end tests (Playwright)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage
```

## Test Types

### Unit Tests (`tests/unit/`)
- **Purpose**: Test individual functions and classes in isolation
- **Speed**: Very fast (< 100ms per test)
- **Dependencies**: No database, no network, mocked external dependencies
- **Example**: Testing utility functions, data transformations, business logic

### Integration Tests (`tests/integration/`)
- **Purpose**: Test API endpoints and database interactions
- **Speed**: Fast (< 1s per test)
- **Dependencies**: Running server required, real database
- **Example**: Testing REST API endpoints, database queries, auth flows

### E2E Tests (`tests/e2e/`)
- **Purpose**: Test complete user workflows in browser
- **Speed**: Slow (> 5s per test)
- **Dependencies**: Running server, database, and browser
- **Example**: Testing full user journeys, UI interactions

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/utils';

describe('myFunction', () => {
  it('should return correct result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('GET /api/resource', () => {
  it('should return resource data', async () => {
    const response = await fetch('http://localhost:5001/api/resource');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
  });
});
```

## Test Coverage Goals

- **Overall**: > 80%
- **Critical paths**: > 95% (auth, payments, orders)
- **Utility functions**: > 90%
- **UI components**: > 70%

## CI Integration

Tests run automatically on:
- Every pull request
- Every commit to main branch
- Before deployment

## Best Practices

1. **Test behavior, not implementation** - Test what the code does, not how it does it
2. **Keep tests independent** - Each test should be runnable in isolation
3. **Use descriptive names** - Test names should clearly describe what is being tested
4. **Arrange-Act-Assert** - Structure tests with clear setup, execution, and validation
5. **Mock external dependencies** - Don't rely on external services in unit tests
6. **Test edge cases** - Include tests for error conditions and boundary cases

## Debugging Tests

```bash
# Run single test file
npx vitest run tests/unit/myTest.test.ts

# Run tests matching pattern
npx vitest run --grep "should handle errors"

# Run with verbose output
npx vitest run --reporter=verbose
```

## Migration from Ad-hoc Tests

The following files are legacy ad-hoc tests and should be migrated:
- `critical_mobile_*.js` → `tests/e2e/mobile/`
- `*_comprehensive_test.{js,mjs}` → Appropriate test directory
- `test_*.js` → Appropriate test directory

These files are excluded from the new test infrastructure but preserved for reference.
