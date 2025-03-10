# SIP Assistant

A sophisticated AI-powered platform for drafting, reviewing, and managing SuperRare Improvement Proposals (SIPs). This tool combines modern web technologies with advanced language models to streamline the governance proposal process for RareDAO.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![Vue Version](https://img.shields.io/badge/vue-3.x-brightgreen)

## 🌟 Key Features

### AI-Powered Assistance
- Multiple LLM provider support (OpenAI, Anthropic, Local models)
- Intelligent context generation from existing SIPs
- Smart template enforcement and validation
- Real-time writing assistance and formatting

### Modern Web Interface
- Responsive Vue.js frontend with real-time updates
- Markdown rendering with syntax highlighting
- Interactive chat interface with message history
- Export functionality for proposals and discussions

### Data Management
- Automatic forum scraping and data collection
- Efficient context compression and storage
- Structured proposal template enforcement
- Version control and history tracking

### Security & Performance
- Rate limiting and request validation
- Content Security Policy implementation
- Cross-Origin Resource Sharing (CORS) protection
- Efficient caching and data compression

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- Access to an LLM provider (OpenAI, Anthropic, or local setup)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SIP-assistant.git
   cd SIP-assistant
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - `OPENAI_API_KEY` (if using OpenAI)
   - `ANTHROPIC_API_KEY` (if using Anthropic)
   - `LOCAL_LLM_BASE_URL` (if using local model)
   - `FORUM_BASE_URL`
   - Other configuration options

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build and start:
   ```bash
   npm run build:frontend
   npm run start
   ```

## 💻 Development

### Available Scripts

```bash
# Development mode (frontend + backend)
npm run dev

# Frontend development
npm run dev:frontend

# Backend development
npm run dev:backend

# Production build
npm run build:frontend

# Testing
npm run test           # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # UI-based test runner

# Code quality
npm run lint          # Check code style
npm run lint:fix      # Fix code style
npm run format        # Format code
```

### Project Structure

```
SIP-assistant/
├── src/                  # Source code
│   ├── assets/          # Static assets
│   ├── components/      # Vue components
│   ├── providers/       # LLM provider implementations
│   ├── utils/           # Utility functions
│   ├── App.vue          # Root Vue component
│   ├── main.js          # Frontend entry point
│   ├── chatbot.js       # Backend server
│   └── scraper.js       # Forum data collection
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── public/             # Public static files
├── dist/               # Build output
└── output/             # Generated data
```

## 🛠 Technical Architecture

### Frontend (Vue.js)
- Vue 3 with Composition API
- Vite for fast development and building
- Real-time markdown rendering
- Prism.js for syntax highlighting
- Responsive design with modern CSS

### Backend (Node.js)
- Express.js server
- WebSocket support for real-time updates
- Multiple LLM provider integrations
- Forum data scraping and processing
- Efficient data storage and caching

### Testing & Quality
- Vitest for unit and integration testing
- Vue Test Utils for component testing
- ESLint + Prettier for code quality
- Comprehensive test coverage
- Automated CI/CD pipeline

## 🔒 Security Features

- Helmet.js for security headers
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure environment variable handling
- CORS configuration
- Content Security Policy (CSP)

## 📋 SIP Structure

Each SIP follows a standardized format:

1. **Summary**
   - Brief overview of the proposal
   - Key objectives and goals

2. **Background**
   - Context and history
   - Related proposals or initiatives

3. **Motivation**
   - Problem statement
   - Desired outcomes

4. **Specification**
   - Detailed implementation plan
   - Technical requirements
   - Parameters and configurations

5. **Benefits**
   - Expected positive outcomes
   - Value proposition

6. **Drawbacks**
   - Potential risks
   - Mitigation strategies

7. **Implementation**
   - Action items
   - Timeline
   - Resource requirements

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 About RareDAO

RareDAO governs the SuperRare protocol, focusing on:
- Protocol development and upgrades
- Treasury management and allocation
- Community governance and voting
- Market making and liquidity provision
- Cross-chain deployments (Ethereum + Base)
- Strategic initiatives and partnerships

Visit [forum.rare.xyz](https://forum.rare.xyz) for more information about RareDAO and SuperRare.

## 📚 Additional Resources

- [SuperRare Documentation](https://docs.rare.xyz)
- [RareDAO Governance](https://forum.rare.xyz/c/proposals)
- [API Documentation](./docs/API.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Deployment and Build Process

### Frontend Build

To build the Vue.js frontend for production, run:

```bash
npm run build:frontend
```

This command uses Vite to generate optimized, production-ready assets in the `dist/` directory.

### Backend Build and Process Manager (PM2)

The backend is a Node.js application. There is no separate build step for the backend code. Instead, you run the backend using Node.js directly. In production, the backend is managed by PM2 (a process manager) to ensure it restarts automatically on failure.

An ecosystem configuration file `ecosystem.config.js` is provided in the project root. This file contains the following configuration:

```javascript
module.exports = {
  apps: [
    {
      name: "sip-assistant",
      script: "src/chatbot.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production"
      },
      env_development: {
        NODE_ENV: "development"
      }
    }
  ]
}; 
```

#### Using PM2

1. **Install PM2 Globally (if not already installed):**

   ```bash
   npm install -g pm2
   ```

2. **Start the Server with PM2:**

   In production mode, start the backend server with:

   ```bash
   pm2 start ecosystem.config.js
   ```

   PM2 will automatically restart the server if it crashes.

3. **Check PM2 Status:**

   Use the following command to view the status of the managed processes:

   ```bash
   pm2 status
   ```

4. **Stopping or Deleting the Process:**

   To stop the process:

   ```bash
   pm2 stop sip-assistant
   ```

   Or, to completely remove it from PM2's process list:

   ```bash
   pm2 delete sip-assistant
   ```

#### Development Mode

For development, you can run the backend without PM2 using:

```bash
npm run dev:backend
```

Alternatively, run the combined development environment for both frontend and backend with:

```bash
npm run dev
```

### Summary

- **Frontend Build:** Run `npm run build:frontend` to deploy your Vue.js app.
- **Backend (Production):** Use PM2 with `ecosystem.config.js` to manage the Node.js server.
- **Stop/Restart PM2 Process:** Use `pm2 stop sip-assistant` or `pm2 delete sip-assistant` to turn it off.
- **Development:** Use `npm run dev` for a combined dev environment, or `npm run dev:backend` for backend only.
