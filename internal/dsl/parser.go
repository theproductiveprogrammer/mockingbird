package dsl

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

var (
	delayRegex  = regexp.MustCompile(`^\+(\d+)(ms|s|m|h)`)
	statusRegex = regexp.MustCompile(`^\[(\d{3})\]`)
)

// Parse parses a .mock template string into a ParsedTemplate
func Parse(template string) (*models.ParsedTemplate, error) {
	result := &models.ParsedTemplate{
		StatusCode: 200, // Default status
		Headers:    make(map[string]string),
	}

	lines := strings.Split(template, "\n")
	lineIdx := 0

	// Parse delay if present
	if lineIdx < len(lines) {
		line := strings.TrimSpace(lines[lineIdx])
		if delay, ok := parseDelay(line); ok {
			result.Delay = delay
			lineIdx++
		}
	}

	// Parse status code if present
	if lineIdx < len(lines) {
		line := strings.TrimSpace(lines[lineIdx])
		if status, ok := parseStatus(line); ok {
			result.StatusCode = status
			lineIdx++
		}
	}

	// Parse headers section if present
	if lineIdx < len(lines) {
		line := strings.TrimSpace(lines[lineIdx])
		if line == "headers:" {
			lineIdx++
			headers, consumed := parseHeaders(lines[lineIdx:])
			result.Headers = headers
			lineIdx += consumed
		}
	}

	// Parse body section
	if lineIdx < len(lines) {
		line := strings.TrimSpace(lines[lineIdx])
		if line == "body:" {
			lineIdx++
			// Everything after "body:" is the body content
			bodyLines := lines[lineIdx:]
			result.Body = strings.Join(bodyLines, "\n")
		}
	}

	return result, nil
}

// parseDelay parses a delay directive like "+200ms" or "+2s"
func parseDelay(line string) (time.Duration, bool) {
	matches := delayRegex.FindStringSubmatch(line)
	if len(matches) != 3 {
		return 0, false
	}

	value, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, false
	}

	unit := matches[2]
	switch unit {
	case "ms":
		return time.Duration(value) * time.Millisecond, true
	case "s":
		return time.Duration(value) * time.Second, true
	case "m":
		return time.Duration(value) * time.Minute, true
	case "h":
		return time.Duration(value) * time.Hour, true
	default:
		return 0, false
	}
}

// parseStatus parses a status code like "[200]"
func parseStatus(line string) (int, bool) {
	matches := statusRegex.FindStringSubmatch(line)
	if len(matches) != 2 {
		return 0, false
	}

	status, err := strconv.Atoi(matches[1])
	if err != nil {
		return 0, false
	}

	return status, true
}

// parseHeaders parses a YAML-style headers section
// Returns the headers map and the number of lines consumed
func parseHeaders(lines []string) (map[string]string, int) {
	headers := make(map[string]string)
	consumed := 0

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Empty line or start of new section ends headers
		if trimmed == "" || trimmed == "body" {
			break
		}

		// Headers are indented with spaces and follow "key: value" format
		if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") {
			break
		}

		// Parse "key: value"
		parts := strings.SplitN(trimmed, ":", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// Remove quotes if present
			value = strings.Trim(value, "\"'")
			headers[key] = value
			consumed = i + 1
		}
	}

	return headers, consumed
}

// Format formats a ParsedTemplate back into .mock format
func Format(pt *models.ParsedTemplate) string {
	var sb strings.Builder

	// Add delay if present
	if pt.Delay > 0 {
		sb.WriteString(formatDelay(pt.Delay))
		sb.WriteString("\n")
	}

	// Add status code
	sb.WriteString(fmt.Sprintf("[%d]\n", pt.StatusCode))

	// Add headers if present
	if len(pt.Headers) > 0 {
		sb.WriteString("headers:\n")
		for key, value := range pt.Headers {
			sb.WriteString(fmt.Sprintf("  %s: %s\n", key, value))
		}
	}

	// Add body
	if pt.Body != "" {
		sb.WriteString("body:\n")
		sb.WriteString(pt.Body)
	}

	return sb.String()
}

// formatDelay formats a duration into the +Xms/s/m format
func formatDelay(d time.Duration) string {
	if d < time.Second {
		return fmt.Sprintf("+%dms", d.Milliseconds())
	}
	if d < time.Minute {
		return fmt.Sprintf("+%ds", int(d.Seconds()))
	}
	if d < time.Hour {
		return fmt.Sprintf("+%dm", int(d.Minutes()))
	}
	return fmt.Sprintf("+%dh", int(d.Hours()))
}
