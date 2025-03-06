# Testing Best Practices

## Testing Philosophy

Testing is a critical part of maintaining a healthy codebase. The SIP Assistant project follows these testing principles:

1. **Test Behavior, Not Implementation**: Focus on testing what the code does, not how it does it
2. **Test at the Right Level**: Use the appropriate type of test for each scenario
3. **Keep Tests Fast**: Tests should run quickly to encourage frequent execution
4. **Keep Tests Independent**: Tests should not depend on each other
5. **Keep Tests Readable**: Tests should serve as documentation

## Test Types

### Unit Tests

Unit tests verify that individual components work as expected in isolation.

**When to use**: For testing pure functions, utility methods, and small components.

**Example**:

```javascript
// Testing a utility function
import { formatDate } from '../utils/date';

describe('formatDate', () => {
  test('formats date in YYYY-MM-DD format', () => {
    const date = new Date('2023-05-15T12:00:00Z');
    expect(formatDate(date)).toBe('2023-05-15');
  });

  test('returns empty string for invalid date', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('not a date')).toBe('');
  });
});
```

### Component Tests

Component tests verify that UI components render and behave correctly.

**When to use**: For testing Vue components, focusing on props, events, and rendering.

**Example**:

```javascript
import { mount } from '@vue/test-utils';
import MessageItem from '../components/MessageItem.vue';

describe('MessageItem.vue', () => {
  test('renders message content', () => {
    const message = { id: 1, content: 'Hello World', sender: 'user' };
    const wrapper = mount(MessageItem, {
      props: { message }
    });
    expect(wrapper.text()).toContain('Hello World');
  });

  test('emits copy event when copy button is clicked', async () => {
    const message = { id: 1, content: 'Hello World', sender: 'user' };
    const wrapper = mount(MessageItem, {
      props: { message }
    });
    
    await wrapper.find('.copy-button').trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual([message.content]);
  });
});
```

### Integration Tests

Integration tests verify that multiple components or services work together correctly.

**When to use**: For testing interactions between components, API calls, and service integrations.

**Example**:

```javascript
import { mount } from '@vue/test-utils';
import ChatInterface from '../components/ChatInterface.vue';
import { createMockChatService } from '../test/mocks/chatService';

// Mock the API
import { vi } from 'vitest';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  sendMessage: vi.fn().mockResolvedValue({
    content: 'Response from API',
    timestamp: new Date().toISOString()
  })
}));

describe('ChatInterface integration', () => {
  test('sends message to API and displays response', async () => {
    const wrapper = mount(ChatInterface);
    
    // Simulate user input
    await wrapper.find('input').setValue('Hello API');
    await wrapper.find('form').trigger('submit');
    
    // Wait for async operations
    await wrapper.vm.$nextTick();
    
    // Verify API was called
    expect(api.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Hello API' })
    );
    
    // Verify response is displayed
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Response from API');
  });
});
```

### API Tests

API tests verify that API endpoints work correctly.

**When to use**: For testing Express routes, request validation, and response formatting.

**Example**:

```javascript
const request = require('supertest');
const app = require('../src/chatbot');

describe('API endpoints', () => {
  test('GET /api/status returns 200 and correct status', async () => {
    const response = await request(app).get('/api/status');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('version');
  });
  
  test('POST /api/chat returns 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ /* missing required fields */ });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
});
```

## Test Organization

### Directory Structure

Tests should mirror the structure of the source code:

```
SIP-assistant/
├── src/
│   ├── components/
│   │   └── ChatInterface.vue
│   ├── services/
│   │   └── chat.js
│   └── utils/
│       └── date.js
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   │   └── ChatInterface.spec.js
│   │   ├── services/
│   │   │   └── chat.spec.js
│   │   └── utils/
│   │       └── date.spec.js
│   └── integration/
│       └── api.spec.js
```

### Naming Conventions

- Test files should end with `.spec.js` or `.test.js`
- Test suites should be named after the module they test
- Test cases should clearly describe the behavior being tested

## Test Doubles

### Mocks

Use mocks to replace dependencies with test-specific implementations:

```javascript
import { vi } from 'vitest';
import * as chatService from '../services/chat';

// Mock a service
vi.mock('../services/chat', () => ({
  sendMessage: vi.fn().mockResolvedValue('Mocked response')
}));

// Verify the mock was called correctly
expect(chatService.sendMessage).toHaveBeenCalledWith('Hello');
```

### Stubs

Use stubs to provide canned responses for specific test scenarios:

```javascript
import { vi } from 'vitest';

// Create a stub for localStorage
const localStorageStub = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};

// Replace the real localStorage with the stub
Object.defineProperty(window, 'localStorage', {
  value: localStorageStub
});

// Configure the stub for a specific test
localStorageStub.getItem.mockReturnValue(JSON.stringify({ theme: 'dark' }));
```

### Spies

Use spies to observe method calls without changing behavior:

```javascript
import { vi } from 'vitest';

// Spy on a method
const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

// Run the code that might call console.error
someFunction();

// Verify the spy was called
expect(consoleSpy).toHaveBeenCalled();

// Restore the original implementation
consoleSpy.mockRestore();
```

## Testing Asynchronous Code

### Promises

Use `async/await` for testing promises:

```javascript
test('async function returns correct data', async () => {
  const result = await fetchData();
  expect(result).toEqual({ id: 1, name: 'Test' });
});
```

### Timeouts and Intervals

Use Vitest's timer mocks for testing code with timeouts:

```javascript
import { vi } from 'vitest';

test('debounce function delays execution', () => {
  // Use fake timers
  vi.useFakeTimers();
  
  const callback = vi.fn();
  const debounced = debounce(callback, 1000);
  
  // Call the debounced function
  debounced();
  
  // Fast-forward time
  vi.advanceTimersByTime(500);
  expect(callback).not.toHaveBeenCalled();
  
  vi.advanceTimersByTime(500);
  expect(callback).toHaveBeenCalledTimes(1);
  
  // Restore real timers
  vi.useRealTimers();
});
```

## Test Coverage

### Coverage Goals

- Aim for at least 80% code coverage
- Focus on critical paths and complex logic
- Don't chase 100% coverage at the expense of test quality

### Coverage Reports

Generate coverage reports to identify untested code:

```bash
npm run test:coverage
```

## Test-Driven Development (TDD)

Consider using TDD for complex features:

1. Write a failing test that defines the expected behavior
2. Implement the minimum code needed to pass the test
3. Refactor the code while keeping the tests passing

## Continuous Integration

Run tests automatically on every pull request:

- Configure GitHub Actions or another CI service
- Fail the build if tests fail
- Generate and publish coverage reports

By following these testing best practices, we can maintain a reliable and robust codebase for the SIP Assistant project. 