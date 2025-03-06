# Backend Architecture Best Practices

## Service-Oriented Architecture

The SIP Assistant backend follows a service-oriented architecture pattern, where functionality is organized into focused, domain-specific services.

### Service Design Principles

1. **Single Responsibility**: Each service should have a clear, focused purpose
2. **Encapsulation**: Services should hide their implementation details
3. **Interface-Based Design**: Services should expose a clear, stable API
4. **Dependency Injection**: Services should receive their dependencies rather than creating them

### Service Structure

A well-designed service should:

- Export a class with a clear name (e.g., `ChatService`, `VectorService`)
- Have a constructor that accepts dependencies
- Provide public methods that form its API
- Keep implementation details private

Example:

```javascript
class DocumentService {
  constructor(storageService, vectorService) {
    this.storage = storageService;
    this.vectorService = vectorService;
  }

  async getDocument(id) {
    // Public API method
    return this.storage.retrieve(id);
  }

  async searchDocuments(query, options = {}) {
    // Public API method
    const vectors = await this.vectorService.queryEmbeddings(query);
    return this._processSearchResults(vectors, options);
  }

  _processSearchResults(vectors, options) {
    // Private implementation detail
    // ...
  }
}
```

## API Design

### RESTful Endpoints

Design RESTful API endpoints following these conventions:

- Use nouns for resources (e.g., `/documents`, `/users`)
- Use HTTP methods appropriately (GET, POST, PUT, DELETE)
- Use query parameters for filtering and pagination
- Use proper status codes (200, 201, 400, 404, 500, etc.)

Example:

```javascript
// GET /api/documents?limit=10&category=governance
app.get('/api/documents', (req, res) => {
  const { limit, category } = req.query;
  // ...
});

// POST /api/documents
app.post('/api/documents', (req, res) => {
  const newDocument = req.body;
  // ...
});

// GET /api/documents/123
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  // ...
});
```

### Input Validation

Always validate input data:

```javascript
const validateDocumentInput = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

app.post('/api/documents', validateDocumentInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid input...
});
```

## Error Handling

### Consistent Error Pattern

Use a consistent error handling pattern throughout the application:

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }
}

// Usage
if (!user) {
  throw new AppError('User not found', 404);
}
```

### Global Error Handler

Implement a global error handler middleware:

```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error
  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }
  
  // Send response
  res.status(statusCode).json({
    status: 'error',
    message,
    details: err.details || {},
    timestamp: err.timestamp || new Date()
  });
});
```

## Asynchronous Processing

### Promise Handling

Use async/await for cleaner asynchronous code:

```javascript
// Good
async function getDocumentWithRelated(id) {
  try {
    const document = await documentService.getDocument(id);
    const relatedDocs = await documentService.getRelatedDocuments(id);
    return { document, relatedDocs };
  } catch (error) {
    console.error('Error fetching document:', error);
    throw new AppError('Failed to fetch document', 500);
  }
}

// Avoid
function getDocumentWithRelated(id) {
  return documentService.getDocument(id)
    .then(document => {
      return documentService.getRelatedDocuments(id)
        .then(relatedDocs => {
          return { document, relatedDocs };
        });
    })
    .catch(error => {
      console.error('Error fetching document:', error);
      throw new AppError('Failed to fetch document', 500);
    });
}
```

### Rate Limiting and Concurrency

Manage API rate limits and concurrency:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

// Apply to all API routes
app.use('/api/', limiter);

// Or to specific routes
app.use('/api/llm/', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // limit each IP to 10 LLM requests per minute
}));
```

## Security

### Input Sanitization

Sanitize user input to prevent injection attacks:

```javascript
const sanitizeHtml = require('sanitize-html');

app.post('/api/comments', (req, res) => {
  const sanitizedComment = sanitizeHtml(req.body.comment, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
      'a': ['href']
    }
  });
  
  // Store sanitized comment
});
```

### Authentication and Authorization

Implement proper authentication and authorization:

```javascript
// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Authorization middleware
const authorize = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// Usage
app.post('/api/admin/settings', authenticate, authorize('admin'), (req, res) => {
  // Only admins can access this endpoint
});
```

## Logging

### Structured Logging

Use structured logging for better searchability:

```javascript
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      stack: error?.stack,
      ...meta
    }));
  }
};

// Usage
logger.info('User logged in', { userId: user.id, ip: req.ip });
```

### Request Logging

Log incoming requests and their outcomes:

```javascript
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Capture response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log response
    logger.info(`${req.method} ${req.url} ${res.statusCode}`, {
      duration,
      contentLength: res.getHeader('content-length')
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});
```

By following these backend architecture best practices, we can build a robust, maintainable, and secure backend for the SIP Assistant project. 