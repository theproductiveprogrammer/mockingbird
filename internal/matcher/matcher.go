package matcher

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

// Match finds the first matching rule for a request
// Returns the matched rule and its index, or (nil, -1) if no match
func Match(rules []models.Rule, ctx *models.RequestContext) (*models.Rule, int) {
	for i, rule := range rules {
		if matchRule(&rule, ctx) {
			return &rule, i
		}
	}
	return nil, -1
}

// matchRule checks if a single rule matches the request
func matchRule(rule *models.Rule, ctx *models.RequestContext) bool {
	// Match method
	if !matchMethod(rule.Match.Method, ctx.Method) {
		return false
	}

	// Match path
	if !matchPath(rule.Match.Path, ctx.Path) {
		return false
	}

	// Match headers
	if !matchHeaders(rule.Match.Headers, ctx.Headers) {
		return false
	}

	// Match body
	if !matchBody(rule.Match.Body, ctx.Body) {
		return false
	}

	return true
}

// matchMethod checks if the request method matches
func matchMethod(ruleMethods []string, reqMethod string) bool {
	// If no methods specified, match any
	if len(ruleMethods) == 0 {
		return true
	}

	for _, method := range ruleMethods {
		if strings.EqualFold(method, reqMethod) {
			return true
		}
	}

	return false
}

// matchPath checks if the request path matches
// Supports exact match and wildcard matching with **
func matchPath(rulePath, reqPath string) bool {
	// If no path specified, match any
	if rulePath == "" {
		return true
	}

	// Exact match
	if rulePath == reqPath {
		return true
	}

	// Wildcard match: /servicex/** matches /servicex/users, /servicex/users/123, etc.
	if strings.HasSuffix(rulePath, "/**") {
		prefix := strings.TrimSuffix(rulePath, "/**")
		// Must start with prefix and either be exact or have a /
		if reqPath == prefix {
			return true
		}
		if strings.HasPrefix(reqPath, prefix+"/") {
			return true
		}
	}

	// Single wildcard: /users/* matches /users/123 but not /users/123/posts
	if strings.Contains(rulePath, "/*") && !strings.Contains(rulePath, "/**") {
		pattern := strings.ReplaceAll(rulePath, "/*", "/[^/]+")
		pattern = "^" + pattern + "$"
		matched, _ := regexp.MatchString(pattern, reqPath)
		return matched
	}

	// Path parameter matching: /users/{id} matches /users/123
	if strings.Contains(rulePath, "{") && strings.Contains(rulePath, "}") {
		pattern := regexp.MustCompile(`\{[^}]+\}`)
		regexPattern := "^" + pattern.ReplaceAllString(rulePath, "[^/]+") + "$"
		matched, _ := regexp.MatchString(regexPattern, reqPath)
		return matched
	}

	return false
}

// matchHeaders checks if request headers match
func matchHeaders(ruleHeaders map[string]string, reqHeaders map[string][]string) bool {
	// If no headers specified, match any
	if len(ruleHeaders) == 0 {
		return true
	}

	for key, expectedValue := range ruleHeaders {
		// Find header value (case-insensitive)
		var actualValue string
		for reqKey, values := range reqHeaders {
			if strings.EqualFold(reqKey, key) && len(values) > 0 {
				actualValue = values[0]
				break
			}
		}

		// If header not found or doesn't match
		if actualValue != expectedValue {
			return false
		}
	}

	return true
}

// matchBody checks if request body matches
func matchBody(bodyMatch *models.BodyMatch, reqBody interface{}) bool {
	// If no body match specified, match any
	if bodyMatch == nil || bodyMatch.Matches == "" {
		return true
	}

	// Convert body to string for regex matching
	var bodyStr string
	switch v := reqBody.(type) {
	case string:
		bodyStr = v
	case map[string]interface{}:
		// Convert JSON to string
		jsonBytes, err := json.Marshal(v)
		if err != nil {
			return false
		}
		bodyStr = string(jsonBytes)
	default:
		return false
	}

	// Match regex
	matched, err := regexp.MatchString(bodyMatch.Matches, bodyStr)
	if err != nil {
		fmt.Printf("Invalid regex pattern %s: %v\n", bodyMatch.Matches, err)
		return false
	}

	return matched
}
