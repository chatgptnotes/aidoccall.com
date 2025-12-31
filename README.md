# Claude Code Autonomous Agent

A powerful autonomous agent system for Claude Code that automatically handles confirmations, prompts, and decision-making without user intervention.

## Features

- **Auto-Approval System**: Automatically approves file operations, git commands, deployments, and more
- **Slash Commands**: Control the agent with intuitive slash commands (`/approve-all`, `/deny-all`, etc.)
- **Smart Decision Making**: Intelligent decision logic based on context and safety
- **Version Management**: Automatic version incrementing with Git pushes
- **Permission Handling**: Auto-approve location access, notifications, and other browser permissions
- **Real-time Monitoring**: Live status indicator and decision logging
- **Configuration Management**: Export/import settings for team consistency

## Quick Start

### 1. Installation

```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
```env
VITE_ENABLE_AUTONOMOUS_AGENT=true
VITE_AGENT_AUTO_APPROVE=true
VITE_AGENT_DEFAULT_VERSION=1.0
```

### 3. Basic Usage

The autonomous agent starts automatically when the app loads. Look for the green "Agent ON" indicator in the top-left corner.

#### Slash Commands

Press `Ctrl+Shift+C` to open the command palette, or use these commands:

- `/approve-all` - Enable auto-approval for all operations
- `/deny-all` - Disable auto-approval, require manual confirmation
- `/agent-status` - Show current agent status and statistics
- `/toggle-agent` - Toggle agent on/off
- `/help` - Show all available commands

## Test the Agent

After starting the development server, visit:

**🌐 Test URL:** http://localhost:5173

1. Click the "Agent ON" indicator in the top-left
2. Try slash commands with `Ctrl+Shift+C`
3. Test auto-approval by triggering confirmations
4. Monitor decisions in the control panel

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production  
npm run preview          # Preview production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Code Quality
npm run lint             # Run linter
npm run lint:fix         # Fix linting issues automatically

# Agent Management
npm run agent:enable     # Enable autonomous agent
npm run agent:disable    # Disable autonomous agent
npm run agent:status     # Check agent status
```

## Architecture

### Core Components

1. **AutonomousAgent** - Main agent logic and decision making
2. **SlashCommands** - Command parsing and execution  
3. **AgentStatus** - React component for status display
4. **useAutonomousAgent** - React hook for easy integration

### Security

- No secrets stored in code
- All settings saved in localStorage  
- Configurable permission levels
- Audit trail of all decisions
- Safe defaults for unknown operations

## Support

For issues and questions:
- Use `/help` for command assistance
- Check the control panel for status
- Review decision logs for troubleshooting

---

**Claude Code Autonomous Agent v1.1.0** - Built with React, Vite, and modern JavaScript.
