/**
 * Autonomous Agent System for Claude Code
 * Handles auto-approval and autonomous decision making
 */

class AutonomousAgent {
  constructor() {
    this.isActive = true;
    this.autoApprovalEnabled = true;
    this.decisionLog = [];
    this.version = '1.0';
    this.lastUpdate = new Date().toISOString();
    
    // Initialize agent settings
    this.settings = {
      autoApproveFileOps: true,
      autoApproveBashCommands: true,
      autoApproveDeployments: true,
      autoApprovePermissions: true,
      autoApproveLocationAccess: true,
      logDecisions: true,
      incrementVersionOnPush: true
    };

    this.init();
  }

  init() {
    console.log('Claude Code Autonomous Agent v' + this.version + ' initialized');
    this.loadSettings();
    this.setupEventListeners();
  }

  /**
   * Load agent settings from localStorage or use defaults
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('claudeAgent_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.warn('Could not load agent settings:', error);
    }
  }

  /**
   * Save current settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('claudeAgent_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Could not save agent settings:', error);
    }
  }

  /**
   * Setup event listeners for confirmation dialogs and permission requests
   */
  setupEventListeners() {
    // Override native confirm function
    window.originalConfirm = window.confirm;
    window.confirm = (message) => {
      return this.handleConfirmation(message);
    };

    // Override prompt function
    window.originalPrompt = window.prompt;
    window.prompt = (message, defaultText) => {
      return this.handlePrompt(message, defaultText);
    };

    // Listen for permission requests
    this.interceptPermissionRequests();
  }

  /**
   * Handle confirmation dialogs automatically
   */
  handleConfirmation(message) {
    const decision = this.makeDecision(message, 'confirmation');
    
    this.logDecision({
      type: 'confirmation',
      message,
      decision,
      timestamp: new Date().toISOString(),
      autoApproved: this.autoApprovalEnabled
    });

    if (this.autoApprovalEnabled) {
      console.log(`Auto-approved: ${message}`);
      return decision;
    }

    return window.originalConfirm(message);
  }

  /**
   * Handle prompt dialogs with sensible defaults
   */
  handlePrompt(message, defaultText = '') {
    const response = this.generatePromptResponse(message, defaultText);
    
    this.logDecision({
      type: 'prompt',
      message,
      response,
      defaultText,
      timestamp: new Date().toISOString(),
      autoResponded: this.autoApprovalEnabled
    });

    if (this.autoApprovalEnabled) {
      console.log(`Auto-responded to prompt: ${message} -> ${response}`);
      return response;
    }

    return window.originalPrompt(message, defaultText);
  }

  /**
   * Make intelligent decisions based on context
   */
  makeDecision(message, type) {
    const lowerMessage = message.toLowerCase();

    // File operations - generally approve
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      return lowerMessage.includes('temp') || lowerMessage.includes('cache') || 
             lowerMessage.includes('node_modules') || lowerMessage.includes('.git');
    }

    // Git operations - approve pushes, commits, pulls
    if (lowerMessage.includes('git') || lowerMessage.includes('commit') || 
        lowerMessage.includes('push') || lowerMessage.includes('pull')) {
      return true;
    }

    // Build/test operations - approve
    if (lowerMessage.includes('build') || lowerMessage.includes('test') || 
        lowerMessage.includes('lint') || lowerMessage.includes('deploy')) {
      return true;
    }

    // Package installations - approve
    if (lowerMessage.includes('install') || lowerMessage.includes('npm') || 
        lowerMessage.includes('yarn') || lowerMessage.includes('package')) {
      return true;
    }

    // Permission requests - approve based on settings
    if (lowerMessage.includes('permission') || lowerMessage.includes('access')) {
      return this.settings.autoApprovePermissions;
    }

    // Location access - approve if enabled
    if (lowerMessage.includes('location')) {
      return this.settings.autoApproveLocationAccess;
    }

    // Default to approve for development operations
    return true;
  }

  /**
   * Generate sensible responses to prompts
   */
  generatePromptResponse(message, defaultText) {
    const lowerMessage = message.toLowerCase();

    // Version-related prompts
    if (lowerMessage.includes('version')) {
      return this.getNextVersion();
    }

    // Commit message prompts
    if (lowerMessage.includes('commit') || lowerMessage.includes('message')) {
      return this.generateCommitMessage();
    }

    // Port/URL prompts
    if (lowerMessage.includes('port')) {
      return '3000';
    }

    // File name prompts
    if (lowerMessage.includes('filename') || lowerMessage.includes('file name')) {
      return this.generateFileName();
    }

    // Use default if provided, otherwise generate contextual response
    return defaultText || this.generateContextualResponse(message);
  }

  /**
   * Get next version number
   */
  getNextVersion() {
    const currentVersion = parseFloat(this.version);
    const nextVersion = (currentVersion + 0.1).toFixed(1);
    this.version = nextVersion;
    return nextVersion;
  }

  /**
   * Generate automatic commit message
   */
  generateCommitMessage() {
    const timestamp = new Date().toISOString().split('T')[0];
    return `Auto-commit: Feature updates and improvements - ${timestamp}`;
  }

  /**
   * Generate contextual filename
   */
  generateFileName() {
    const timestamp = Date.now();
    return `file_${timestamp}.js`;
  }

  /**
   * Generate contextual response based on message content
   */
  generateContextualResponse(message) {
    // Simple AI-like response generation
    if (message.includes('name')) return 'AutoAgent';
    if (message.includes('email')) return 'agent@claudecode.ai';
    if (message.includes('url')) return 'http://localhost:3000';
    if (message.includes('path')) return './';
    return 'yes';
  }

  /**
   * Intercept and handle permission requests
   */
  interceptPermissionRequests() {
    // Override geolocation permissions
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = function(success, error, options) {
        if (window.autonomousAgent && window.autonomousAgent.settings.autoApproveLocationAccess) {
          console.log('Auto-approved geolocation access');
          // Mock successful location response
          success({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10
            },
            timestamp: Date.now()
          });
          return;
        }
        return originalGetCurrentPosition.call(this, success, error, options);
      };
    }

    // Override notification permissions
    if ('Notification' in window) {
      const originalRequestPermission = Notification.requestPermission;
      Notification.requestPermission = function() {
        if (window.autonomousAgent && window.autonomousAgent.settings.autoApprovePermissions) {
          console.log('Auto-approved notification permissions');
          return Promise.resolve('granted');
        }
        return originalRequestPermission.apply(this, arguments);
      };
    }
  }

  /**
   * Log decisions for audit trail
   */
  logDecision(decision) {
    if (!this.settings.logDecisions) return;
    
    this.decisionLog.push(decision);
    
    // Keep only last 1000 decisions to prevent memory issues
    if (this.decisionLog.length > 1000) {
      this.decisionLog = this.decisionLog.slice(-1000);
    }

    // Save to localStorage periodically
    if (this.decisionLog.length % 10 === 0) {
      this.saveDecisionLog();
    }
  }

  /**
   * Save decision log to localStorage
   */
  saveDecisionLog() {
    try {
      localStorage.setItem('claudeAgent_decisionLog', JSON.stringify(this.decisionLog));
    } catch (error) {
      console.warn('Could not save decision log:', error);
    }
  }

  /**
   * Get decision statistics
   */
  getStats() {
    return {
      totalDecisions: this.decisionLog.length,
      approvedDecisions: this.decisionLog.filter(d => d.decision === true).length,
      rejectedDecisions: this.decisionLog.filter(d => d.decision === false).length,
      autoApprovalRate: this.autoApprovalEnabled ? '100%' : 'Variable',
      version: this.version,
      lastUpdate: this.lastUpdate,
      isActive: this.isActive
    };
  }

  /**
   * Enable autonomous mode
   */
  enable() {
    this.isActive = true;
    this.autoApprovalEnabled = true;
    console.log('Claude Code Autonomous Agent enabled');
  }

  /**
   * Disable autonomous mode
   */
  disable() {
    this.isActive = false;
    this.autoApprovalEnabled = false;
    console.log('Claude Code Autonomous Agent disabled');
  }

  /**
   * Toggle autonomous mode
   */
  toggle() {
    if (this.isActive) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isActive;
  }

  /**
   * Update footer version on page
   */
  updateFooterVersion() {
    const footers = document.querySelectorAll('.version-footer, [class*="footer"]');
    const versionText = `v${this.version} - ${new Date().toLocaleDateString()}`;
    
    footers.forEach(footer => {
      if (footer.textContent.includes('v') || footer.textContent.includes('version')) {
        footer.textContent = versionText;
        footer.style.color = '#888';
        footer.style.fontSize = '12px';
      }
    });
  }

  /**
   * Create footer if it doesn't exist
   */
  ensureFooter() {
    if (!document.querySelector('.auto-version-footer')) {
      const footer = document.createElement('div');
      footer.className = 'auto-version-footer';
      footer.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        color: #888;
        font-size: 11px;
        z-index: 9999;
        pointer-events: none;
      `;
      footer.textContent = `v${this.version} - ${new Date().toLocaleDateString()}`;
      document.body.appendChild(footer);
    }
  }

  /**
   * Handle Git operations with version increments
   */
  onGitPush() {
    if (this.settings.incrementVersionOnPush) {
      this.getNextVersion();
      this.lastUpdate = new Date().toISOString();
      this.updateFooterVersion();
      this.saveSettings();
    }
  }
}

// Initialize autonomous agent
if (typeof window !== 'undefined') {
  window.autonomousAgent = new AutonomousAgent();
  
  // Ensure footer exists on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.autonomousAgent.ensureFooter();
    });
  } else {
    window.autonomousAgent.ensureFooter();
  }
}

export default AutonomousAgent;