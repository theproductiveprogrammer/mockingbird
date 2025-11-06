package store

import (
	"strings"
	"testing"
)

func TestIsTextContent(t *testing.T) {
	tests := []struct {
		contentType string
		expected    bool
	}{
		{"application/json", true},
		{"application/json; charset=utf-8", true},
		{"text/html", true},
		{"text/plain", true},
		{"application/xml", true},
		{"application/javascript", true},
		{"image/png", false},
		{"image/jpeg", false},
		{"application/pdf", false},
		{"application/octet-stream", false},
		{"", true}, // Empty defaults to text
	}

	for _, tt := range tests {
		t.Run(tt.contentType, func(t *testing.T) {
			result := isTextContent(tt.contentType)
			if result != tt.expected {
				t.Errorf("isTextContent(%q) = %v, expected %v", tt.contentType, result, tt.expected)
			}
		})
	}
}

func TestTruncateStringBody(t *testing.T) {
	tests := []struct {
		name        string
		body        string
		contentType string
		expectTrunc bool
		maxLen      int
	}{
		{
			name:        "small JSON body not truncated",
			body:        `{"key": "value"}`,
			contentType: "application/json",
			expectTrunc: false,
			maxLen:      0,
		},
		{
			name:        "large JSON body uses 2MB limit",
			body:        strings.Repeat("a", maxTextBodySizeBytes+100),
			contentType: "application/json",
			expectTrunc: true,
			maxLen:      maxTextBodySizeBytes,
		},
		{
			name:        "large binary body uses 1KB limit",
			body:        strings.Repeat("b", 2000),
			contentType: "image/png",
			expectTrunc: true,
			maxLen:      maxBinaryBodySizeBytes,
		},
		{
			name:        "text/html uses 2MB limit",
			body:        strings.Repeat("c", maxTextBodySizeBytes+100),
			contentType: "text/html",
			expectTrunc: true,
			maxLen:      maxTextBodySizeBytes,
		},
		{
			name:        "PDF uses 1KB limit",
			body:        strings.Repeat("d", 5000),
			contentType: "application/pdf",
			expectTrunc: true,
			maxLen:      maxBinaryBodySizeBytes,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := truncateStringBody(tt.body, tt.contentType)

			if tt.expectTrunc {
				if !strings.HasSuffix(result, "...[truncated]") {
					t.Errorf("Expected truncation suffix, got: %s", result[len(result)-20:])
				}
				expectedLen := tt.maxLen + len("...[truncated]")
				if len(result) != expectedLen {
					t.Errorf("Expected length %d, got %d", expectedLen, len(result))
				}
			} else {
				if result != tt.body {
					t.Errorf("Expected no truncation, body was modified")
				}
			}
		})
	}
}

func TestTruncateBody(t *testing.T) {
	tests := []struct {
		name        string
		body        interface{}
		contentType string
		expectTrunc bool
	}{
		{
			name:        "small JSON object not truncated",
			body:        map[string]interface{}{"key": "value"},
			contentType: "",
			expectTrunc: false,
		},
		{
			name:        "large JSON object truncated at 2MB",
			body:        map[string]interface{}{"data": strings.Repeat("x", maxTextBodySizeBytes+100)},
			contentType: "",
			expectTrunc: true,
		},
		{
			name:        "small string not truncated",
			body:        "hello",
			contentType: "text/plain",
			expectTrunc: false,
		},
		{
			name:        "large text string uses 2MB limit",
			body:        strings.Repeat("a", maxTextBodySizeBytes+100),
			contentType: "text/plain",
			expectTrunc: true,
		},
		{
			name:        "large binary string uses 1KB limit",
			body:        strings.Repeat("b", 2000),
			contentType: "image/jpeg",
			expectTrunc: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := truncateBody(tt.body, tt.contentType)

			if tt.expectTrunc {
				resultStr, ok := result.(string)
				if !ok {
					t.Errorf("Expected string result, got %T", result)
					return
				}
				if !strings.HasSuffix(resultStr, "...[truncated]") {
					t.Errorf("Expected truncation suffix")
				}
			} else {
				// For non-truncated cases, result should match input (or be equivalent JSON)
				switch v := tt.body.(type) {
				case string:
					if result != v {
						t.Errorf("Expected no truncation for string")
					}
				case map[string]interface{}, []interface{}:
					// JSON objects are returned as-is when not truncated (just verify type matches)
					switch result.(type) {
					case map[string]interface{}, []interface{}:
						// Good - returned as JSON object
					default:
						t.Errorf("Expected JSON object/array to be preserved, got %T", result)
					}
				}
			}
		})
	}
}
