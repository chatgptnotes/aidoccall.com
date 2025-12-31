/**
 * React Hook for Autonomous Agent Integration
 * Provides easy integration with the autonomous agent system
 */

import { useState, useEffect, useCallback } from 'react';
import AutonomousAgent from '../agents/AutonomousAgent';
import SlashCommands from '../commands/SlashCommands';

const useAutonomousAgent = () => {
  const [agent, setAgent] = useState(null);
  const [commands, setCommands] = useState(null);
  const [status, setStatus] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize agent and commands
  useEffect(() => {
    let agentInstance = window.autonomousAgent;
    let commandsInstance = window.slashCommands;

    if (!agentInstance) {
      agentInstance = new AutonomousAgent();
      window.autonomousAgent = agentInstance;
    }

    if (!commandsInstance) {
      commandsInstance = new SlashCommands(agentInstance);
      window.slashCommands = commandsInstance;
    }

    setAgent(agentInstance);
    setCommands(commandsInstance);
    setIsInitialized(true);

    // Initial status update
    updateStatus();
  }, []);

  // Update status function
  const updateStatus = useCallback(() => {
    if (window.autonomousAgent) {
      setStatus(window.autonomousAgent.getStats());
    }
  }, []);

  // Auto-update status every 5 seconds
  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(updateStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isInitialized, updateStatus]);

  // Execute command function
  const executeCommand = useCallback((command) => {
    if (commands) {
      commands.executeCommand(command);
      // Update status after command execution
      setTimeout(updateStatus, 100);
      return true;
    }
    return false;
  }, [commands, updateStatus]);

  // Enable autonomous mode
  const enableAgent = useCallback(() => {
    if (agent) {
      agent.enable();
      updateStatus();
    }
  }, [agent, updateStatus]);

  // Disable autonomous mode
  const disableAgent = useCallback(() => {
    if (agent) {
      agent.disable();
      updateStatus();
    }
  }, [agent, updateStatus]);

  // Toggle autonomous mode
  const toggleAgent = useCallback(() => {
    if (agent) {
      agent.toggle();
      updateStatus();
      return agent.isActive;
    }
    return false;
  }, [agent, updateStatus]);

  // Auto-approve all operations
  const approveAll = useCallback(() => {
    return executeCommand('/approve-all');
  }, [executeCommand]);

  // Deny all operations (manual confirmation)
  const denyAll = useCallback(() => {
    return executeCommand('/deny-all');
  }, [executeCommand]);

  // Get decision log
  const getDecisionLog = useCallback((count = 10) => {
    if (agent) {
      return agent.decisionLog.slice(-count);
    }
    return [];
  }, [agent]);

  // Clear decision log
  const clearLog = useCallback(() => {
    return executeCommand('/clear-log');
  }, [executeCommand]);

  // Export configuration
  const exportConfig = useCallback(() => {
    if (agent) {
      return {
        settings: agent.settings,
        version: agent.version,
        lastUpdate: agent.lastUpdate
      };
    }
    return null;
  }, [agent]);

  // Import configuration
  const importConfig = useCallback((config) => {
    if (agent && config) {
      if (config.settings) {
        agent.settings = { ...agent.settings, ...config.settings };
      }
      if (config.version) {
        agent.version = config.version;
      }
      agent.saveSettings();
      updateStatus();
      return true;
    }
    return false;
  }, [agent, updateStatus]);

  // Update version
  const updateVersion = useCallback((newVersion) => {
    if (agent) {
      agent.version = newVersion;
      agent.updateFooterVersion();
      agent.saveSettings();
      updateStatus();
      return true;
    }
    return false;
  }, [agent, updateStatus]);

  // Handle Git push (increment version)
  const onGitPush = useCallback(() => {
    if (agent) {
      agent.onGitPush();
      updateStatus();
    }
  }, [agent, updateStatus]);

  // Create a confirmation that will be auto-approved
  const autoConfirm = useCallback((message, defaultValue = true) => {
    if (agent && agent.isActive) {
      return agent.makeDecision(message, 'confirmation');
    }
    return window.originalConfirm ? window.originalConfirm(message) : defaultValue;
  }, [agent]);

  // Create a prompt that will be auto-responded
  const autoPrompt = useCallback((message, defaultText = '') => {
    if (agent && agent.isActive) {
      return agent.generatePromptResponse(message, defaultText);
    }
    return window.originalPrompt ? window.originalPrompt(message, defaultText) : defaultText;
  }, [agent]);

  return {
    // State
    agent,
    commands,
    status,
    isInitialized,
    isActive: status.isActive,
    version: status.version,
    
    // Actions
    executeCommand,
    enableAgent,
    disableAgent,
    toggleAgent,
    approveAll,
    denyAll,
    updateStatus,
    
    // Data
    getDecisionLog,
    clearLog,
    exportConfig,
    importConfig,
    updateVersion,
    onGitPush,
    
    // Utilities
    autoConfirm,
    autoPrompt,
    
    // Settings shortcuts
    settings: agent?.settings || {},
    totalDecisions: status.totalDecisions || 0,
    approvedDecisions: status.approvedDecisions || 0,
    autoApprovalRate: status.autoApprovalRate || '0%'
  };
};

export default useAutonomousAgent;