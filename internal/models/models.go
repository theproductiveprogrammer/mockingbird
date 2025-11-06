package models

import (
	"time"
)

// TrafficEntry represents a recorded request/response pair
type TrafficEntry struct {
	ID           string              `json:"id"`
	Timestamp    time.Time           `json:"timestamp"`
	Service      string              `json:"service"`
	Method       string              `json:"method"`
	Path         string              `json:"path"`
	QueryParams  map[string][]string `json:"query"`
	Headers      map[string][]string `json:"headers"`
	Body         interface{}         `json:"body"` // JSON object or string
	Response     *Response           `json:"response,omitempty"`
	MatchedRule  *int                `json:"matched_rule,omitempty"` // Index of matched rule
	RuleType     string              `json:"rule_type,omitempty"`    // "proxy", "mock", or "timeout"
}

// Response represents an HTTP response
type Response struct {
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
	DelayMS    int64             `json:"delay_ms,omitempty"`
}

// Rule represents a single matching rule
type Rule struct {
	Match    MatchCondition    `json:"match" yaml:"match"`
	ProxyTo  string            `json:"proxyto,omitempty" yaml:"proxyto,omitempty"`   // Upstream URL
	Headers  map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`   // Headers to inject
	Response string            `json:"response,omitempty" yaml:"response,omitempty"` // .mock template
	Enabled  *bool             `json:"enabled,omitempty" yaml:"enabled,omitempty"`   // Whether rule is enabled (defaults to true)
}

// MatchCondition defines criteria for matching requests
type MatchCondition struct {
	Method  []string          `json:"method,omitempty" yaml:"method,omitempty"`
	Path    string            `json:"path,omitempty" yaml:"path,omitempty"`
	Headers map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
	Body    *BodyMatch        `json:"body,omitempty" yaml:"body,omitempty"`
	Query   map[string]string `json:"query,omitempty" yaml:"query,omitempty"`
}

// BodyMatch defines body matching criteria
type BodyMatch struct {
	Matches string `json:"matches,omitempty" yaml:"matches,omitempty"` // Regex pattern
}

// ServiceRules represents all rules for a service
type ServiceRules struct {
	Rules []Rule `yaml:"rules"`
}

// ParsedTemplate represents a parsed .mock template
type ParsedTemplate struct {
	Delay      time.Duration
	StatusCode int
	Headers    map[string]string
	Body       string
}

// RequestContext provides data for template rendering
type RequestContext struct {
	Method      string
	Path        string
	PathSegments []string
	QueryParams map[string][]string
	Headers     map[string][]string
	Body        interface{} // JSON object or string
}
