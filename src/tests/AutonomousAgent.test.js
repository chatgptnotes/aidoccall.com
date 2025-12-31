/**
 * Tests for Autonomous Agent System
 * Validates auto-approval and decision-making functionality
 */

import AutonomousAgent from '../agents/AutonomousAgent';
import SlashCommands from '../commands/SlashCommands';

// Mock DOM environment
global.document = {
  createElement: jest.fn(() => ({
    style: {},
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    textContent: '',
    className: ''
  })),
  body: {
    appendChild: jest.fn()
  },
  getElementById: jest.fn(),
  readyState: 'complete',
  addEventListener: jest.fn()
};

global.window = {
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  },
  confirm: jest.fn(),
  prompt: jest.fn(),
  navigator: {
    geolocation: {
      getCurrentPosition: jest.fn()
    },
    clipboard: {
      writeText: jest.fn()
    }
  },
  crypto: {
    randomUUID: () => 'test-uuid-' + Date.now()
  }
};

global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('AutonomousAgent', () => {
  let agent;
  
  beforeEach(() => {
    agent = new AutonomousAgent();
    // Clear any previous state
    agent.decisionLog = [];
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default settings', () => {
      expect(agent.isActive).toBe(true);
      expect(agent.autoApprovalEnabled).toBe(true);
      expect(agent.version).toBe('1.0');
      expect(agent.settings.autoApproveFileOps).toBe(true);
      expect(agent.settings.autoApproveBashCommands).toBe(true);
      expect(agent.settings.autoApproveDeployments).toBe(true);
    });

    test('should setup event listeners', () => {
      expect(window.confirm).toBeDefined();
      expect(window.prompt).toBeDefined();
    });
  });

  describe('Decision Making', () => {
    test('should approve git operations', () => {
      const decision = agent.makeDecision('Do you want to commit changes?', 'confirmation');
      expect(decision).toBe(true);
    });

    test('should approve build operations', () => {
      const decision = agent.makeDecision('Run build process?', 'confirmation');
      expect(decision).toBe(true);
    });

    test('should approve package installations', () => {
      const decision = agent.makeDecision('Install npm packages?', 'confirmation');
      expect(decision).toBe(true);
    });

    test('should be cautious with delete operations', () => {
      const dangerousDelete = agent.makeDecision('Delete production database?', 'confirmation');
      expect(dangerousDelete).toBe(false);
      
      const safeDelete = agent.makeDecision('Delete temp files?', 'confirmation');
      expect(safeDelete).toBe(true);
    });
  });

  describe('Confirmation Handling', () => {
    test('should auto-approve confirmations when enabled', () => {
      agent.autoApprovalEnabled = true;
      const result = agent.handleConfirmation('Proceed with deployment?');
      expect(result).toBe(true);
    });

    test('should log decisions', () => {
      agent.handleConfirmation('Test confirmation');
      expect(agent.decisionLog).toHaveLength(1);
      expect(agent.decisionLog[0].type).toBe('confirmation');
      expect(agent.decisionLog[0].message).toBe('Test confirmation');
    });
  });

  describe('Prompt Handling', () => {
    test('should generate version responses', () => {
      const response = agent.generatePromptResponse('What version?', '');
      expect(response).toMatch(/^\d+\.\d+$/);
    });

    test('should generate commit messages', () => {
      const response = agent.generatePromptResponse('Enter commit message', '');
      expect(response).toContain('Auto-commit');
      expect(response).toContain('Feature updates');
    });

    test('should handle port prompts', () => {
      const response = agent.generatePromptResponse('Enter port number', '');
      expect(response).toBe('3000');
    });
  });

  describe('Version Management', () => {
    test('should increment version correctly', () => {
      agent.version = '1.0';
      const nextVersion = agent.getNextVersion();
      expect(nextVersion).toBe('1.1');
      expect(agent.version).toBe('1.1');
    });

    test('should handle decimal versions', () => {
      agent.version = '1.9';
      const nextVersion = agent.getNextVersion();
      expect(nextVersion).toBe('2.0');
    });
  });

  describe('Settings Management', () => {
    test('should save and load settings', () => {
      agent.settings.autoApproveFileOps = false;
      agent.saveSettings();
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'claudeAgent_settings',
        expect.stringContaining('"autoApproveFileOps":false')
      );
    });

    test('should enable and disable agent', () => {
      agent.disable();
      expect(agent.isActive).toBe(false);
      expect(agent.autoApprovalEnabled).toBe(false);
      
      agent.enable();
      expect(agent.isActive).toBe(true);
      expect(agent.autoApprovalEnabled).toBe(true);
    });

    test('should toggle agent state', () => {
      const initialState = agent.isActive;
      const newState = agent.toggle();
      expect(newState).toBe(!initialState);
    });
  });

  describe('Statistics', () => {
    test('should provide accurate stats', () => {
      // Add some test decisions
      agent.logDecision({
        type: 'confirmation',
        decision: true,
        timestamp: new Date().toISOString()
      });
      agent.logDecision({
        type: 'confirmation',
        decision: false,
        timestamp: new Date().toISOString()
      });

      const stats = agent.getStats();
      expect(stats.totalDecisions).toBe(2);
      expect(stats.approvedDecisions).toBe(1);
      expect(stats.rejectedDecisions).toBe(1);
      expect(stats.version).toBe(agent.version);
      expect(stats.isActive).toBe(agent.isActive);
    });
  });
});

describe('SlashCommands', () => {
  let agent;
  let commands;
  
  beforeEach(() => {
    agent = new AutonomousAgent();
    commands = new SlashCommands(agent);
  });

  describe('Command Execution', () => {
    test('should execute approve-all command', () => {
      const result = commands.executeCommand('/approve-all');
      expect(agent.isActive).toBe(true);
      expect(agent.settings.autoApproveFileOps).toBe(true);
    });

    test('should execute deny-all command', () => {
      commands.executeCommand('/deny-all');
      expect(agent.isActive).toBe(false);
    });

    test('should execute toggle-agent command', () => {
      const initialState = agent.isActive;
      commands.executeCommand('/toggle-agent');
      expect(agent.isActive).toBe(!initialState);
    });

    test('should handle unknown commands', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      commands.executeCommand('/unknown-command');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown command')
      );
    });
  });

  describe('Status Commands', () => {
    test('should show agent status', () => {
      agent.logDecision({
        type: 'test',
        decision: true,
        timestamp: new Date().toISOString()
      });

      const result = commands.showStatus();
      expect(result).toContain('Agent Status');
      expect(result).toContain('Version');
      expect(result).toContain('Total Decisions: 1');
    });

    test('should show decision log', () => {
      agent.logDecision({
        type: 'confirmation',
        message: 'Test decision',
        decision: true,
        timestamp: new Date().toISOString()
      });

      const result = commands.showLog(['1']);
      expect(result).toContain('Showing last 1 decisions');
    });
  });

  describe('Configuration Commands', () => {
    test('should set version', () => {
      const result = commands.setVersion(['2.5']);
      expect(agent.version).toBe('2.5');
      expect(result).toContain('Version set to 2.5');
    });

    test('should export configuration', () => {
      agent.settings.testSetting = true;
      const result = commands.exportConfig();
      expect(result).toContain('Configuration exported');
    });

    test('should reset agent', () => {
      agent.version = '5.0';
      agent.settings.autoApproveFileOps = false;
      
      commands.resetAgent();
      
      expect(agent.version).toBe('1.0');
      expect(agent.settings.autoApproveFileOps).toBe(true);
    });
  });

  describe('Help System', () => {
    test('should show help for all commands', () => {
      const result = commands.showHelp([]);
      expect(result).toBe('Help displayed');
    });

    test('should show help for specific command', () => {
      commands.showHelp(['/approve-all']);
      // Should display help without error
    });

    test('should handle unknown command help', () => {
      const result = commands.showHelp(['/non-existent']);
      expect(result).toContain('Unknown command');
    });
  });
});

describe('Integration Tests', () => {
  test('should integrate agent with commands seamlessly', () => {
    const agent = new AutonomousAgent();
    const commands = new SlashCommands(agent);

    // Test workflow: disable -> enable -> check status
    commands.executeCommand('/deny-all');
    expect(agent.isActive).toBe(false);

    commands.executeCommand('/approve-all');
    expect(agent.isActive).toBe(true);
    expect(agent.settings.autoApproveFileOps).toBe(true);

    const stats = agent.getStats();
    expect(stats.isActive).toBe(true);
  });

  test('should maintain decision log across operations', () => {
    const agent = new AutonomousAgent();
    
    // Simulate some decisions
    agent.handleConfirmation('First decision');
    agent.handleConfirmation('Second decision');
    agent.handlePrompt('Version prompt', '1.0');

    expect(agent.decisionLog).toHaveLength(3);
    
    const stats = agent.getStats();
    expect(stats.totalDecisions).toBe(3);
  });
});