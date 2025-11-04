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

  const services = Object.values(serviceRules);

  if (services.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">No rules configured</p>
          <p className="text-sm mt-2">Add a .yaml file to ~/.config/mockingbird/</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Rules</h1>

        {services.map((service, idx) => (
          <div key={`${service.service}-${idx}`} className="mb-8">
            {/* Service Header */}
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                /{service.service}
              </h2>
              <Tag variant="service">{service.rules.length} rules</Tag>
              {service.file && (
                <span className="text-sm text-gray-500 font-mono">
                  {service.file}
                </span>
              )}
            </div>

            {/* Rules List */}
            <div className="space-y-4">
              {service.rules.map((rule) => (
                <div
                  key={`${service.service}-${rule.index}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {/* Rule Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Rule #{rule.index}
                    </span>
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

                  {/* Match Conditions */}
                  <div className="space-y-2 mb-3">
                    {rule.match.path && (
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Path: </span>
                        <span className="font-mono text-gray-900">
                          {rule.match.path}
                        </span>
                      </div>
                    )}

                    {rule.match.headers && Object.keys(rule.match.headers).length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Headers: </span>
                        <span className="font-mono text-gray-700">
                          {Object.entries(rule.match.headers)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </span>
                      </div>
                    )}

                    {rule.match.body?.matches && (
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Body matches: </span>
                        <span className="font-mono text-gray-700">
                          {rule.match.body.matches}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Response Type */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      {rule.response ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">→ Returns</span>
                          <Tag variant="service">mock response</Tag>
                        </div>
                      ) : rule.proxyto ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">→ Proxies to</span>
                          <span className="text-sm font-mono text-blue-600">
                            {rule.proxyto}
                          </span>
                          {rule.headers && Object.keys(rule.headers).length > 0 && (
                            <Tag variant="service">
                              +{Object.keys(rule.headers).length} headers
                            </Tag>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          No action defined
                        </span>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingRule({ service: service.service, rule })}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
