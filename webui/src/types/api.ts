// API type definitions for Mockingbird
export interface TrafficEntry {
  id: string;
  timestamp: string;
  service: string;
  method: string;
  path: string;
  query: Record<string, string[]>;
  headers: Record<string, string[]>;
  body: any;
  response?: MockResponse;
  matched_rule?: number;
  rule_type: "mock" | "proxy" | "timeout";
}

export interface MockResponse {
  status_code: number;
  headers: Record<string, string>;
  body: string;
  delay_ms: number;
}

export interface Rule {
  match: MatchCondition;
  proxyto?: string;
  headers?: Record<string, string>;
  response?: string;
  enabled?: boolean;
}

export interface MatchCondition {
  method?: string[];
  path?: string;
  headers?: Record<string, string>;
  body?: BodyMatch;
  query?: Record<string, string>;
}

export interface BodyMatch {
  matches: string;
}

export interface ServiceRules {
  service: string;
  file?: string;
  rules: RuleWithIndex[];
}

export interface RuleWithIndex extends Rule {
  index: number;
}

export interface Config {
  proxy_port: number;
  admin_port: number;
  config_dir: string;
  values: Record<string, string>;
  version?: string;
  build_name?: string;
  build_time?: string;
  commit_hash?: string;
  go_version?: string;
}

export interface Stats {
  total_requests: number;
  total_rules: number;
  services: Record<string, ServiceStats>;
}

export interface ServiceStats {
  requests: number;
  rules: number;
}
