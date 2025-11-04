package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/theproductiveprogrammer/mockingbird.git/internal/admin"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/config"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/proxy"
	"github.com/theproductiveprogrammer/mockingbird.git/internal/store"
)

func main() {
	fmt.Println("🐦 Mockingbird - Starting...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Config directory: %s\n", cfg.ConfigDir)
	fmt.Printf("Proxy port: %d\n", cfg.ProxyPort)
	fmt.Printf("Admin port: %d\n", cfg.AdminPort)

	// Initialize store
	st, err := store.New(cfg.ConfigDir)
	if err != nil {
		fmt.Printf("Error initializing store: %v\n", err)
		os.Exit(1)
	}

	// Create proxy handler
	proxyHandler := proxy.NewHandler(cfg, st)

	// Create admin API
	adminAPI := admin.NewAPI(cfg, st)

	// Create HTTP servers
	proxyServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.ProxyPort),
		Handler: proxyHandler,
	}

	adminServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.AdminPort),
		Handler: adminAPI,
	}

	// Start servers
	go func() {
		fmt.Printf("🚀 Proxy server listening on http://localhost:%d\n", cfg.ProxyPort)
		if err := proxyServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Proxy server error: %v\n", err)
		}
	}()

	go func() {
		fmt.Printf("🔧 Admin API listening on http://localhost:%d\n", cfg.AdminPort)
		if err := adminServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Admin server error: %v\n", err)
		}
	}()

	// Print loaded rules summary
	allRules := st.GetAllRules()
	if len(allRules) > 0 {
		fmt.Println("\n📋 Loaded rules:")
		for service, rules := range allRules {
			fmt.Printf("  - %s: %d rule(s)\n", service, len(rules))
		}
	} else {
		fmt.Println("\n⚠️  No rules loaded. Create rules via the Admin API.")
		fmt.Printf("   Example: curl -X POST http://localhost:%d/api/rules/servicex -H 'Content-Type: application/json' -d '{...}'\n", cfg.AdminPort)
	}

	fmt.Println("\n✅ Mockingbird is ready!")
	fmt.Println("---")
	fmt.Printf("📍 Proxy:     http://localhost:%d\n", cfg.ProxyPort)
	fmt.Printf("📍 Admin API: http://localhost:%d\n", cfg.AdminPort)
	fmt.Printf("📍 Health:    http://localhost:%d/health\n", cfg.AdminPort)
	fmt.Printf("📍 Traffic:   http://localhost:%d/api/traffic/stream\n", cfg.AdminPort)
	fmt.Println("---")

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	fmt.Println("\n🛑 Shutting down gracefully...")

	// Close store first to terminate all SSE connections
	if err := st.Close(); err != nil {
		fmt.Printf("Store close error: %v\n", err)
	}

	// Give SSE connections a moment to close
	time.Sleep(100 * time.Millisecond)

	// Shutdown servers with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := proxyServer.Shutdown(ctx); err != nil {
		fmt.Printf("Proxy server shutdown error: %v\n", err)
	}

	if err := adminServer.Shutdown(ctx); err != nil {
		fmt.Printf("Admin server shutdown error: %v\n", err)
	}

	fmt.Println("✨ Mockingbird stopped.")
}
