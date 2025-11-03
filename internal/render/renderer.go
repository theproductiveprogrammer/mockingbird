package render

import (
	"bytes"
	"fmt"
	"math/rand"
	"reflect"
	"strconv"
	"strings"
	"text/template"
	"time"

	"github.com/google/uuid"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/models"
)

// Renderer renders templates with request context
type Renderer struct {
	config *config.Config
}

// NewRenderer creates a new template renderer
func NewRenderer(cfg *config.Config) *Renderer {
	return &Renderer{config: cfg}
}

// Render renders a template string with the given request context
func (r *Renderer) Render(templateStr string, ctx *models.RequestContext) (string, error) {
	// Create template with custom functions
	tmpl, err := template.New("response").Funcs(r.funcMap(ctx)).Parse(templateStr)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, ctx); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// funcMap returns the template function map with request context
func (r *Renderer) funcMap(ctx *models.RequestContext) template.FuncMap {
	return template.FuncMap{
		"uuid":           genUUID,
		"now":            genNow,
		"random":         genRandom,
		"reqHeader":      r.reqHeader(ctx),
		"reqPathParam":   r.reqPathParam(ctx),
		"reqQueryParam":  r.reqQueryParam(ctx),
		"reqBody":        r.reqBody(ctx),
		"config":         r.configValue,
	}
}

// genUUID generates a new UUID
func genUUID() string {
	return uuid.New().String()
}

// genNow returns the current timestamp in RFC3339 format
func genNow() string {
	return time.Now().Format(time.RFC3339)
}

// genRandom generates a random number between from and to (inclusive)
func genRandom(from, to int) int {
	if from >= to {
		return from
	}
	return from + rand.Intn(to-from+1)
}

// reqHeader returns a function that gets a request header
func (r *Renderer) reqHeader(ctx *models.RequestContext) func(string) string {
	return func(name string) string {
		if values, ok := ctx.Headers[name]; ok && len(values) > 0 {
			return values[0]
		}
		// Try case-insensitive match
		for key, values := range ctx.Headers {
			if strings.EqualFold(key, name) && len(values) > 0 {
				return values[0]
			}
		}
		return ""
	}
}

// reqPathParam returns a function that gets a path segment by index
func (r *Renderer) reqPathParam(ctx *models.RequestContext) func(int) string {
	return func(index int) string {
		if index >= 0 && index < len(ctx.PathSegments) {
			return ctx.PathSegments[index]
		}
		return ""
	}
}

// reqQueryParam returns a function that gets a query parameter
func (r *Renderer) reqQueryParam(ctx *models.RequestContext) func(string) string {
	return func(name string) string {
		if values, ok := ctx.QueryParams[name]; ok && len(values) > 0 {
			return values[0]
		}
		return ""
	}
}

// reqBody returns a function that gets a value from the JSON body
func (r *Renderer) reqBody(ctx *models.RequestContext) func(string) interface{} {
	return func(path string) interface{} {
		if ctx.Body == nil {
			return nil
		}

		// If body is a string, just return it
		if str, ok := ctx.Body.(string); ok {
			if path == "" {
				return str
			}
			return nil
		}

		// If body is a map, navigate the path
		return navigateBody(ctx.Body, path)
	}
}

// navigateBody navigates a JSON object using dot notation and array indices
// Examples: "user.name", "data[0].id", "summary[1].total"
func navigateBody(body interface{}, path string) interface{} {
	if path == "" {
		return body
	}

	parts := parsePath(path)
	current := body

	for _, part := range parts {
		if part.isArray {
			// Handle array index
			current = getArrayElement(current, part.index)
		} else {
			// Handle object key
			current = getObjectKey(current, part.key)
		}

		if current == nil {
			return nil
		}
	}

	return current
}

type pathPart struct {
	key     string
	isArray bool
	index   int
}

// parsePath parses a path like "user.name" or "data[0].id"
func parsePath(path string) []pathPart {
	var parts []pathPart
	segments := strings.Split(path, ".")

	for _, seg := range segments {
		// Check if segment contains array notation
		if strings.Contains(seg, "[") {
			// Parse "data[0]" into key="data", index=0
			bracketIdx := strings.Index(seg, "[")
			key := seg[:bracketIdx]
			indexStr := seg[bracketIdx+1 : len(seg)-1]
			index, _ := strconv.Atoi(indexStr)

			if key != "" {
				parts = append(parts, pathPart{key: key, isArray: false})
			}
			parts = append(parts, pathPart{isArray: true, index: index})
		} else {
			parts = append(parts, pathPart{key: seg, isArray: false})
		}
	}

	return parts
}

func getObjectKey(obj interface{}, key string) interface{} {
	if obj == nil {
		return nil
	}

	// Use reflection to get the value
	v := reflect.ValueOf(obj)

	// If it's a pointer, dereference it
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	// If it's a map
	if v.Kind() == reflect.Map {
		mapKey := reflect.ValueOf(key)
		val := v.MapIndex(mapKey)
		if val.IsValid() {
			return val.Interface()
		}
	}

	return nil
}

func getArrayElement(arr interface{}, index int) interface{} {
	if arr == nil {
		return nil
	}

	v := reflect.ValueOf(arr)

	// If it's a pointer, dereference it
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	// If it's a slice or array
	if v.Kind() == reflect.Slice || v.Kind() == reflect.Array {
		if index >= 0 && index < v.Len() {
			return v.Index(index).Interface()
		}
	}

	return nil
}

// configValue returns a config value by key
func (r *Renderer) configValue(key string) string {
	return r.config.Get(key)
}
