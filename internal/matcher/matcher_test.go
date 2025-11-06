package matcher

import (
	"testing"
)

func TestMatchQuery(t *testing.T) {
	tests := []struct {
		name      string
		ruleQuery map[string]string
		reqQuery  map[string][]string
		expected  bool
	}{
		{
			name:      "no query params in rule matches any request",
			ruleQuery: map[string]string{},
			reqQuery:  map[string][]string{"key1": {"value1"}, "key2": {"value2"}},
			expected:  true,
		},
		{
			name:      "exact match single param",
			ruleQuery: map[string]string{"key1": "value1"},
			reqQuery:  map[string][]string{"key1": {"value1"}},
			expected:  true,
		},
		{
			name:      "regex match single param",
			ruleQuery: map[string]string{"key1": ".*"},
			reqQuery:  map[string][]string{"key1": {"value1"}},
			expected:  true,
		},
		{
			name:      "multiple params all match",
			ruleQuery: map[string]string{"key1": ".*", "key2": ".*"},
			reqQuery:  map[string][]string{"key1": {"value1"}, "key2": {"value2"}},
			expected:  true,
		},
		{
			name:      "request has extra params not in rule",
			ruleQuery: map[string]string{"key1": ".*"},
			reqQuery:  map[string][]string{"key1": {"value1"}, "key2": {"value2"}},
			expected:  true,
		},
		{
			name:      "request missing param specified in rule with .* pattern",
			ruleQuery: map[string]string{"key1": ".*"},
			reqQuery:  map[string][]string{"key2": {"value2"}},
			expected:  true, // .* matches empty string - this might be unexpected!
		},
		{
			name:      "request missing param specified in rule with specific value",
			ruleQuery: map[string]string{"key1": "value1"},
			reqQuery:  map[string][]string{"key2": {"value2"}},
			expected:  false, // empty string != "value1"
		},
		{
			name:      "param value doesn't match",
			ruleQuery: map[string]string{"key1": "value1"},
			reqQuery:  map[string][]string{"key1": {"wrongvalue"}},
			expected:  false,
		},
		{
			name:      "regex pattern match",
			ruleQuery: map[string]string{"id": "[0-9]+"},
			reqQuery:  map[string][]string{"id": {"12345"}},
			expected:  true,
		},
		{
			name:      "regex pattern no match",
			ruleQuery: map[string]string{"id": "[0-9]+"},
			reqQuery:  map[string][]string{"id": {"abc"}},
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := matchQuery(tt.ruleQuery, tt.reqQuery)
			if result != tt.expected {
				t.Errorf("matchQuery() = %v, expected %v", result, tt.expected)
			}
		})
	}
}
