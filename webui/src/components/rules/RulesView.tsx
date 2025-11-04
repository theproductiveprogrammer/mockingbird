import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { Tag } from '../ui/Tag';
import { Button } from '../ui/Button';
import { RuleEditor } from './RuleEditor';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Rule, RuleWithIndex } from '../../types/api';
import { getRuleTypeBadgeClasses } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function RulesView() {
  const { serviceRules, setServiceRules, highlightedRule, setHighlightedRule } = useAppStore();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [editingRule, setEditingRule] = useState<{
    service: string;
    rule: RuleWithIndex;
  } | null>(null);
  const [deletingRule, setDeletingRule] = useState<{
    service: string;
    rule: RuleWithIndex;
  } | null>(null);
  const [deletingService, setDeletingService] = useState<string | null>(null);
  const [creatingRuleForService, setCreatingRuleForService] = useState<string | null>(null);
  const [creatingNewService, setCreatingNewService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');

  useEffect(() => {
    api.getAllRules().then(setServiceRules);
  }, [setServiceRules]);

  // Auto-expand service and scroll to highlighted rule
  useEffect(() => {
    if (highlightedRule) {
      // Expand the service
      setExpandedServices((prev) => {
        const newSet = new Set(prev);
        newSet.add(highlightedRule.service);
        return newSet;
      });

      // Scroll to the rule after a brief delay to allow expansion
      setTimeout(() => {
        const element = document.getElementById(`rule-${highlightedRule.service}-${highlightedRule.index}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Clear highlight after 3 seconds
      const timeout = setTimeout(() => {
        setHighlightedRule(null);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [highlightedRule, setHighlightedRule]);

  const handleSaveRule = async (updatedRule: Rule) => {
    if (!editingRule) return;

    try {
      await api.updateRule(editingRule.service, editingRule.rule.index, updatedRule);
      toast.success('Rule updated successfully');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);
      setEditingRule(null);
    } catch (error) {
      toast.error('Failed to update rule');
      console.error(error);
    }
  };

  const handleCreateRule = async (newRule: Rule) => {
    if (!creatingRuleForService) return;

    try {
      await api.createRule(creatingRuleForService, newRule);
      toast.success('Rule created successfully');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);
      setCreatingRuleForService(null);
    } catch (error) {
      toast.error('Failed to create rule');
      console.error(error);
    }
  };

  const handleMoveRule = async (service: string, index: number, direction: 'up' | 'down') => {
    try {
      await api.moveRule(service, index, direction);
      toast.success('Rule moved successfully');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);
    } catch (error) {
      toast.error('Failed to move rule');
      console.error(error);
    }
  };

  const handleConfirmDeleteRule = async () => {
    if (!deletingRule) return;

    try {
      await api.deleteRule(deletingRule.service, deletingRule.rule.index);
      toast.success('Rule deleted successfully');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);
      setDeletingRule(null);
    } catch (error) {
      toast.error('Failed to delete rule');
      console.error(error);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!deletingService) return;

    try {
      await api.deleteService(deletingService);
      toast.success('Service deleted successfully');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);
      setDeletingService(null);
    } catch (error) {
      toast.error('Failed to delete service');
      console.error(error);
    }
  };

  const handleToggleRule = async (service: string, rule: RuleWithIndex) => {
    try {
      // Toggle the enabled state (defaults to true if undefined)
      const currentEnabled = rule.enabled !== false; // true if undefined or true
      const newEnabled = !currentEnabled;

      // Create updated rule without the index property
      const { index, ...ruleWithoutIndex } = rule;
      const updatedRule = { ...ruleWithoutIndex, enabled: newEnabled };

      await api.updateRule(service, rule.index, updatedRule);
      toast.success(newEnabled ? 'Rule enabled' : 'Rule disabled');

      // Refresh rules
      const newRules = await api.getAllRules();
      setServiceRules(newRules);
    } catch (error) {
      toast.error('Failed to toggle rule');
      console.error(error);
    }
  };

  const handleCreateNewService = () => {
    if (!newServiceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }

    // Check if service already exists
    if (Object.keys(serviceRules).includes(newServiceName)) {
      toast.error('Service already exists');
      return;
    }

    // Set creating rule for the new service
    setCreatingRuleForService(newServiceName);
    setCreatingNewService(false);
    setNewServiceName('');
  };

  const toggleService = (service: string) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(service)) {
        newSet.delete(service);
      } else {
        newSet.add(service);
      }
      return newSet;
    });
  };

  const services = Object.values(serviceRules);

  if (services.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-sm font-normal">No rules configured</p>
          <p className="text-xs mt-1 text-gray-400">Add a .yaml file to ~/.config/mockingbird/</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xs font-medium text-gray-600 uppercase tracking-wider">Rules</h1>
          {!creatingNewService ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCreatingNewService(true)}
            >
              + New Service
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNewService();
                  if (e.key === 'Escape') {
                    setCreatingNewService(false);
                    setNewServiceName('');
                  }
                }}
                placeholder="service-name"
                className="px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <Button variant="secondary" size="sm" onClick={handleCreateNewService}>
                Create
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCreatingNewService(false);
                  setNewServiceName('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1 font-mono text-xs">
          {services.map((service, idx) => {
            const serviceName = service.service || (service.file ? service.file.replace('.yaml', '') : 'unknown');
            const isExpanded = expandedServices.has(serviceName);

            return (
              <div key={`${serviceName}-${idx}`}>
                {/* Service Line */}
                <div className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 group">
                  <button
                    onClick={() => toggleService(serviceName)}
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                    <span className="text-gray-800 font-medium">{serviceName}.yaml</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-600">{service.rules.length} rules</span>
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreatingRuleForService(serviceName);
                      }}
                    >
                      + Add Rule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-0 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingService(serviceName);
                      }}
                    >
                      delete
                    </Button>
                  </div>
                </div>

                {/* Rules (when expanded) */}
                {isExpanded && (
                  <div className="ml-4 space-y-0">
                    {service.rules.map((rule) => {
                      const isMock = !!rule.response;
                      const isProxy = !!rule.proxyto;
                      const actionType = isMock ? 'mock' : isProxy ? 'proxy' : 'none';
                      const badgeClasses = getRuleTypeBadgeClasses(actionType);
                      const isHighlighted = highlightedRule?.service === serviceName && highlightedRule?.index === rule.index;
                      const isEnabled = rule.enabled !== false; // Defaults to true if undefined

                      return (
                        <div
                          key={`${serviceName}-${rule.index}`}
                          id={`rule-${serviceName}-${rule.index}`}
                          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 group transition-colors ${
                            isHighlighted ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                          }`}
                        >
                          {/* Up/Down buttons */}
                          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRule(serviceName, rule.index, 'up');
                              }}
                              disabled={rule.index === 0}
                              className="text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                            >
                              ▲
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRule(serviceName, rule.index, 'down');
                              }}
                              disabled={rule.index === service.rules.length - 1}
                              className="text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                            >
                              ▼
                            </button>
                          </div>

                          {/* Enable/Disable Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleRule(serviceName, rule);
                            }}
                            className="text-base leading-none cursor-pointer hover:opacity-70 transition-opacity select-none"
                            style={{ color: isEnabled ? '#00C202' : '#9CA3AF' }}
                            title={isEnabled ? 'Click to disable' : 'Click to enable'}
                          >
                            {isEnabled ? '◼' : '◻'}
                          </div>

                          {/* Rule content - clickable */}
                          <div
                            className={`flex items-center gap-2 flex-1 cursor-pointer ${
                              !isEnabled ? 'opacity-50 line-through' : ''
                            }`}
                            onClick={() => setEditingRule({ service: serviceName, rule })}
                          >
                            {/* Rule # and Path */}
                            <span className="text-gray-500">Rule #{rule.index + 1}</span>
                            <span className="text-gray-800">{rule.match.path || '/**'}</span>

                            {/* Body Match (if exists) */}
                            {rule.match.body?.matches && (
                              <span className="text-gray-600 text-xs">
                                [{rule.match.body.matches}]
                              </span>
                            )}

                            {/* Colored Badge */}
                            <span className={`${badgeClasses} px-1 rounded text-xs`}>
                              [{actionType}]
                            </span>

                            {/* Spacer */}
                            <div className="flex-1"></div>

                            {/* Methods */}
                            {rule.match.method && rule.match.method.length > 0 && (
                              <div className="flex gap-1">
                                {rule.match.method.map((method, idx) => (
                                  <Tag key={`${method}-${idx}`} variant="method">
                                    {method}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Edit and Delete buttons (visible on hover) */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs px-2 py-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRule({ service: serviceName, rule });
                              }}
                            >
                              edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs px-2 py-0 text-red-600 hover:text-red-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingRule({ service: serviceName, rule });
                              }}
                            >
                              delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editingRule && (
        <RuleEditor
          service={editingRule.service}
          rule={editingRule.rule}
          index={editingRule.rule.index}
          onSave={handleSaveRule}
          onCancel={() => setEditingRule(null)}
        />
      )}

      {creatingRuleForService && (
        <RuleEditor
          service={creatingRuleForService}
          rule={{
            match: {
              method: ['GET'],
              path: '/**',
            },
            response: `[200]
headers:
  Content-Type: application/json
body:
{
  "message": "Hello World"
}`,
          }}
          index={-1}
          onSave={handleCreateRule}
          onCancel={() => setCreatingRuleForService(null)}
        />
      )}

      {deletingRule && (
        <ConfirmDialog
          title="Delete Rule?"
          message="Are you sure you want to delete this rule?"
          details={`Rule #${deletingRule.rule.index + 1}: ${deletingRule.rule.match.path || '/**'}\nMethods: ${deletingRule.rule.match.method?.join(', ') || 'Any'}\nType: ${deletingRule.rule.response ? 'mock' : 'proxy'}`}
          confirmLabel="Delete Rule"
          onConfirm={handleConfirmDeleteRule}
          onCancel={() => setDeletingRule(null)}
          variant="danger"
        />
      )}

      {deletingService && (
        <ConfirmDialog
          title="Delete Service?"
          message={`Are you sure you want to delete the entire "${deletingService}" service?`}
          details={`This will rename ${deletingService}.yaml to ${deletingService}.yaml.disabled-[timestamp]\nThe file will be preserved but will no longer be loaded.\nYou can manually rename it back to re-enable it.`}
          confirmLabel="Delete Service"
          onConfirm={handleConfirmDeleteService}
          onCancel={() => setDeletingService(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
