/**
 * Slash Commands for Claude Code Autonomous Agent
 * Provides command interface for controlling agent behavior
 */

class SlashCommands {
  constructor(agent) {
    this.agent = agent;
    this.commands = new Map();
    this.commandHistory = [];
    this.setupCommands();
    this.initializeCommandInterface();
  }

  /**
   * Setup all available slash commands
   */
  setupCommands() {
    // Agent control commands
    this.commands.set('/approve-all', {
      description: 'Enable auto-approval for all confirmations',
      usage: '/approve-all',
      handler: () => this.approveAll()
    });

    this.commands.set('/deny-all', {
      description: 'Disable auto-approval, require manual confirmation',
      usage: '/deny-all',
      handler: () => this.denyAll()
    });

    this.commands.set('/toggle-agent', {
      description: 'Toggle autonomous agent on/off',
      usage: '/toggle-agent',
      handler: () => this.toggleAgent()
    });

    // Status and monitoring commands
    this.commands.set('/agent-status', {
      description: 'Show current agent status and statistics',
      usage: '/agent-status',
      handler: () => this.showStatus()
    });

    this.commands.set('/agent-log', {
      description: 'Show recent agent decisions',
      usage: '/agent-log [count]',
      handler: (args) => this.showLog(args)
    });

    // Configuration commands
    this.commands.set('/set-version', {
      description: 'Set current version number',
      usage: '/set-version <version>',
      handler: (args) => this.setVersion(args)
    });

    this.commands.set('/auto-version', {
      description: 'Toggle automatic version incrementing',
      usage: '/auto-version [on|off]',
      handler: (args) => this.toggleAutoVersion(args)
    });

    // Permission commands
    this.commands.set('/approve-files', {
      description: 'Auto-approve file operations',
      usage: '/approve-files [on|off]',
      handler: (args) => this.toggleFilesApproval(args)
    });

    this.commands.set('/approve-git', {
      description: 'Auto-approve git operations',
      usage: '/approve-git [on|off]',
      handler: (args) => this.toggleGitApproval(args)
    });

    this.commands.set('/approve-deploy', {
      description: 'Auto-approve deployment operations',
      usage: '/approve-deploy [on|off]',
      handler: (args) => this.toggleDeployApproval(args)
    });

    this.commands.set('/approve-location', {
      description: 'Auto-approve location access requests',
      usage: '/approve-location [on|off]',
      handler: (args) => this.toggleLocationApproval(args)
    });

    // Utility commands
    this.commands.set('/clear-log', {
      description: 'Clear agent decision log',
      usage: '/clear-log',
      handler: () => this.clearLog()
    });

    this.commands.set('/export-config', {
      description: 'Export current agent configuration',
      usage: '/export-config',
      handler: () => this.exportConfig()
    });

    this.commands.set('/import-config', {
      description: 'Import agent configuration from JSON',
      usage: '/import-config <json>',
      handler: (args) => this.importConfig(args)
    });

    this.commands.set('/reset-agent', {
      description: 'Reset agent to default settings',
      usage: '/reset-agent',
      handler: () => this.resetAgent()
    });

    // Help command
    this.commands.set('/help', {
      description: 'Show all available commands',
      usage: '/help [command]',
      handler: (args) => this.showHelp(args)
    });
  }

  /**
   * Initialize command interface in the browser
   */
  initializeCommandInterface() {
    // Create global command function
    window.runCommand = (command) => this.executeCommand(command);
    
    // Setup keyboard shortcut (Ctrl+Shift+C)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.openCommandPalette();
      }
    });

    // Add command input to page
    this.createCommandInput();
  }

  /**
   * Create floating command input
   */
  createCommandInput() {
    const commandContainer = document.createElement('div');
    commandContainer.id = 'claude-command-container';
    commandContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      padding: 10px;
      display: none;
      min-width: 300px;
    `;

    const commandInput = document.createElement('input');
    commandInput.id = 'claude-command-input';
    commandInput.type = 'text';
    commandInput.placeholder = 'Enter command (e.g., /approve-all)';
    commandInput.style.cssText = `
      width: 100%;
      background: transparent;
      border: 1px solid #444;
      color: white;
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
    `;

    const commandOutput = document.createElement('div');
    commandOutput.id = 'claude-command-output';
    commandOutput.style.cssText = `
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      margin-top: 5px;
      max-height: 200px;
      overflow-y: auto;
    `;

    commandContainer.appendChild(commandInput);
    commandContainer.appendChild(commandOutput);
    document.body.appendChild(commandContainer);

    // Setup command input handler
    commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = e.target.value.trim();
        if (command) {
          this.executeCommand(command);
          e.target.value = '';
        }
      } else if (e.key === 'Escape') {
        this.closeCommandPalette();
      }
    });
  }

  /**
   * Open command palette
   */
  openCommandPalette() {
    const container = document.getElementById('claude-command-container');
    const input = document.getElementById('claude-command-input');
    
    if (container && input) {
      container.style.display = 'block';
      input.focus();
      this.output('Command palette opened. Type /help for available commands.');
    }
  }

  /**
   * Close command palette
   */
  closeCommandPalette() {
    const container = document.getElementById('claude-command-container');
    if (container) {
      container.style.display = 'none';
    }
  }

  /**
   * Execute a slash command
   */
  executeCommand(commandString) {
    const parts = commandString.trim().split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    this.commandHistory.push({
      command: commandString,
      timestamp: new Date().toISOString()
    });

    if (!this.commands.has(command)) {
      this.output(`Unknown command: ${command}. Type /help for available commands.`, 'error');
      return;
    }

    try {
      const result = this.commands.get(command).handler(args);
      if (result && typeof result === 'string') {
        this.output(result);
      }
    } catch (error) {
      this.output(`Error executing command: ${error.message}`, 'error');
    }
  }

  /**
   * Output message to command interface
   */
  output(message, type = 'success') {
    const outputElement = document.getElementById('claude-command-output');
    if (outputElement) {
      const color = type === 'error' ? '#f00' : type === 'warning' ? '#ff0' : '#0f0';
      const line = document.createElement('div');
      line.style.color = color;
      line.textContent = `> ${message}`;
      outputElement.appendChild(line);
      outputElement.scrollTop = outputElement.scrollHeight;
    }
    
    console.log(`[Claude Agent] ${message}`);
  }

  // Command handlers
  approveAll() {
    this.agent.enable();
    this.agent.settings.autoApproveFileOps = true;
    this.agent.settings.autoApproveBashCommands = true;
    this.agent.settings.autoApproveDeployments = true;
    this.agent.settings.autoApprovePermissions = true;
    this.agent.saveSettings();
    return 'Auto-approval enabled for all operations';
  }

  denyAll() {
    this.agent.disable();
    return 'Auto-approval disabled. Manual confirmation required.';
  }

  toggleAgent() {
    const isActive = this.agent.toggle();
    return `Autonomous agent ${isActive ? 'enabled' : 'disabled'}`;
  }

  showStatus() {
    const stats = this.agent.getStats();
    const status = [
      `Agent Status: ${stats.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      `Version: ${stats.version}`,
      `Total Decisions: ${stats.totalDecisions}`,
      `Approved: ${stats.approvedDecisions}`,
      `Auto-approval Rate: ${stats.autoApprovalRate}`,
      `Last Update: ${stats.lastUpdate}`
    ].join('\n');
    
    this.output(status);
    return status;
  }

  showLog(args) {
    const count = args[0] ? parseInt(args[0]) : 10;
    const recentDecisions = this.agent.decisionLog.slice(-count);
    
    if (recentDecisions.length === 0) {
      return 'No decisions logged yet';
    }

    recentDecisions.forEach(decision => {
      const timestamp = new Date(decision.timestamp).toLocaleTimeString();
      this.output(`[${timestamp}] ${decision.type}: ${decision.message} -> ${decision.decision || decision.response}`);
    });

    return `Showing last ${recentDecisions.length} decisions`;
  }

  setVersion(args) {
    if (!args[0]) {
      return 'Usage: /set-version <version>';
    }
    
    this.agent.version = args[0];
    this.agent.updateFooterVersion();
    this.agent.saveSettings();
    return `Version set to ${args[0]}`;
  }

  toggleAutoVersion(args) {
    const setting = args[0];
    if (setting === 'on') {
      this.agent.settings.incrementVersionOnPush = true;
    } else if (setting === 'off') {
      this.agent.settings.incrementVersionOnPush = false;
    } else {
      this.agent.settings.incrementVersionOnPush = !this.agent.settings.incrementVersionOnPush;
    }
    
    this.agent.saveSettings();
    return `Auto-version incrementing ${this.agent.settings.incrementVersionOnPush ? 'enabled' : 'disabled'}`;
  }

  toggleFilesApproval(args) {
    return this.toggleSetting('autoApproveFileOps', args, 'file operations');
  }

  toggleGitApproval(args) {
    return this.toggleSetting('autoApproveBashCommands', args, 'git operations');
  }

  toggleDeployApproval(args) {
    return this.toggleSetting('autoApproveDeployments', args, 'deployments');
  }

  toggleLocationApproval(args) {
    return this.toggleSetting('autoApproveLocationAccess', args, 'location access');
  }

  toggleSetting(setting, args, description) {
    const value = args[0];
    if (value === 'on') {
      this.agent.settings[setting] = true;
    } else if (value === 'off') {
      this.agent.settings[setting] = false;
    } else {
      this.agent.settings[setting] = !this.agent.settings[setting];
    }
    
    this.agent.saveSettings();
    return `Auto-approval for ${description} ${this.agent.settings[setting] ? 'enabled' : 'disabled'}`;
  }

  clearLog() {
    this.agent.decisionLog = [];
    this.agent.saveDecisionLog();
    return 'Decision log cleared';
  }

  exportConfig() {
    const config = {
      settings: this.agent.settings,
      version: this.agent.version,
      lastUpdate: this.agent.lastUpdate
    };
    
    const jsonConfig = JSON.stringify(config, null, 2);
    this.output('Configuration exported:');
    this.output(jsonConfig);
    
    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonConfig);
      this.output('Configuration copied to clipboard');
    }
    
    return 'Configuration exported successfully';
  }

  importConfig(args) {
    try {
      const configJson = args.join(' ');
      const config = JSON.parse(configJson);
      
      if (config.settings) {
        this.agent.settings = { ...this.agent.settings, ...config.settings };
      }
      if (config.version) {
        this.agent.version = config.version;
      }
      
      this.agent.saveSettings();
      return 'Configuration imported successfully';
    } catch (error) {
      return 'Invalid JSON configuration';
    }
  }

  resetAgent() {
    this.agent.settings = {
      autoApproveFileOps: true,
      autoApproveBashCommands: true,
      autoApproveDeployments: true,
      autoApprovePermissions: true,
      autoApproveLocationAccess: true,
      logDecisions: true,
      incrementVersionOnPush: true
    };
    
    this.agent.version = '1.0';
    this.agent.decisionLog = [];
    this.agent.saveSettings();
    this.agent.saveDecisionLog();
    
    return 'Agent reset to default settings';
  }

  showHelp(args) {
    if (args[0]) {
      const command = this.commands.get(args[0]);
      if (command) {
        this.output(`${args[0]}: ${command.description}`);
        this.output(`Usage: ${command.usage}`);
        return;
      } else {
        return `Unknown command: ${args[0]}`;
      }
    }

    this.output('Available Commands:');
    for (const [name, command] of this.commands) {
      this.output(`${name} - ${command.description}`);
    }
    
    this.output('\nPress Ctrl+Shift+C to open command palette');
    return 'Help displayed';
  }
}

export default SlashCommands;