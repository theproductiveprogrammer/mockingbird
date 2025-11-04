import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import { Tag } from '../ui/Tag';
import { Button } from '../ui/Button';
import { RuleEditor } from './RuleEditor';
import { Rule, RuleWithIndex } from '../../types/api';
import toast from 'react-hot-toast';

export function RulesView() {
  const { serviceRules, setServiceRules } = useAppStore();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [editingRule, setEditingRule] = useState<{
    service: string;
    rule: RuleWithIndex;
  } | null>(null);

  useEffect(() => {
    api.getAllRules().then(setServiceRules);
  }, [setServiceRules]);

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
        <h1 className="text-xs font-medium mb-2 text-gray-600 uppercase tracking-wider">Rules</h1>

        <div className="space-y-1 font-mono text-xs">
          {services.map((service, idx) => {
            const serviceName = service.service || (service.file ? service.file.replace('.yaml', '') : 'unknown');
            const isExpanded = expandedServices.has(serviceName);

            return (
              <div key={`${serviceName}-${idx}`}>
                {/* Service Line */}
                <div
                  className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleService(serviceName)}
                >
                  <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
                  <span className="text-gray-700 font-medium">{serviceName}.yaml</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-600">{service.rules.length} rules</span>
                </div>

                {/* Rules (when expanded) */}
                {isExpanded && (
                  <div className="ml-4 space-y-0">
                    {service.rules.map((rule) => {
                      const isMock = !!rule.response;
                      const isProxy = !!rule.proxyto;
                      const arrow = isMock ? '←' : isProxy ? '⇄' : '?';
                      const actionType = isMock ? 'mock' : isProxy ? 'proxy' : 'none';
                      const actionColor = isMock ? 'text-blue-600' : isProxy ? 'text-green-600' : 'text-gray-400';

                      return (
                        <div
                          key={`${serviceName}-${rule.index}`}
                          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 cursor-pointer group"
                          onClick={() => setEditingRule({ service: serviceName, rule })}
                        >
                          {/* Rule # and Path */}
                          <span className="text-gray-500">Rule #{rule.index + 1}</span>
                          <span className="text-gray-700">{rule.match.path || '/**'}</span>

                          {/* Body Match (if exists) */}
                          {rule.match.body?.matches && (
                            <span className="text-gray-600 text-xs">
                              [{rule.match.body.matches}]
                            </span>
                          )}

                          {/* Arrow and Type */}
                          <span className={`${actionColor} mx-1`}>{arrow}</span>
                          <span className={`${actionColor} text-xs`}>[{actionType}]</span>

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

                          {/* Edit button (visible on hover) */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRule({ service: serviceName, rule });
                            }}
                          >
                            edit
                          </Button>
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
    </div>
  );
}
