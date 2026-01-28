import React, { useState, useEffect } from 'react';
import AutonomousAgent from '../agents/AutonomousAgent';
import SlashCommands from '../commands/SlashCommands';

const AgentStatus = () => {
  const [agent, setAgent] = useState(null);
  const [commands, setCommands] = useState(null);
  const [status, setStatus] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initialize agent and commands if not already done
    if (!window.autonomousAgent) {
      window.autonomousAgent = new AutonomousAgent();
    }
    
    if (!window.slashCommands) {
      window.slashCommands = new SlashCommands(window.autonomousAgent);
    }

    setAgent(window.autonomousAgent);
    setCommands(window.slashCommands);
    
    // Update status every 5 seconds
    const updateStatus = () => {
      if (window.autonomousAgent) {
        setStatus(window.autonomousAgent.getStats());
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const executeCommand = (command) => {
    if (commands) {
      commands.executeCommand(command);
      // Refresh status after command execution
      setTimeout(() => {
        if (agent) {
          setStatus(agent.getStats());
        }
      }, 100);
    }
  };

  const quickCommands = [
    { label: 'Enable All', command: '/approve-all' },
    { label: 'Disable All', command: '/deny-all' },
    { label: 'Toggle Agent', command: '/toggle-agent' },
    { label: 'Show Log', command: '/agent-log 5' },
    { label: 'Clear Log', command: '/clear-log' },
    { label: 'Help', command: '/help' }
  ];

  return (
    <>

      {/* Control Panel */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Claude Code Autonomous Agent
                </h2>
                <button
                  onClick={toggleVisibility}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
            </div>

            {/* Status Overview */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Satus</div>
                  <div className={`text-lg font-semibold ${
                    status.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Version</div>
                  <div className="text-lg font-semibold text-gray-900">
                    v{status.version}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Decisions</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {status.totalDecisions || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Approval Rate</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {status.autoApprovalRate || '0%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Commands */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Commands</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {quickCommands.map((cmd, index) => (
                  <button
                    key={index}
                    onClick={() => executeCommand(cmd.command)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            {agent && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-approve File Operations</span>
                    <button
                      onClick={() => executeCommand('/approve-files')}
                      className={`px-3 py-1 rounded text-xs ${
                        agent.settings.autoApproveFileOps 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agent.settings.autoApproveFileOps ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-approve Git Operations</span>
                    <button
                      onClick={() => executeCommand('/approve-git')}
                      className={`px-3 py-1 rounded text-xs ${
                        agent.settings.autoApproveBashCommands 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agent.settings.autoApproveBashCommands ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-approve Deployments</span>
                    <button
                      onClick={() => executeCommand('/approve-deploy')}
                      className={`px-3 py-1 rounded text-xs ${
                        agent.settings.autoApproveDeployments 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agent.settings.autoApproveDeployments ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-approve Location Access</span>
                    <button
                      onClick={() => executeCommand('/approve-location')}
                      className={`px-3 py-1 rounded text-xs ${
                        agent.settings.autoApproveLocationAccess 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agent.settings.autoApproveLocationAccess ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Auto-increment Version</span>
                    <button
                      onClick={() => executeCommand('/auto-version')}
                      className={`px-3 py-1 rounded text-xs ${
                        agent.settings.incrementVersionOnPush 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agent.settings.incrementVersionOnPush ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Command Console */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Command Console</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm">
                  <div>Claude Code Autonomous Agent v{status.version}</div>
                  <div>Type /help for available commands</div>
                  <div>Press Ctrl+Shift+C for command palette</div>
                </div>
                <div className="text-xs text-gray-500">
                  Use slash commands like /approve-all, /agent-status, /help for full control
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-500 text-center">
                v{status.version} - {new Date().toLocaleDateString()} - Claude Code Autonomous Agent
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentStatus;