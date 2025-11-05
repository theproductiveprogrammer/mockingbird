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

// Build-time variables (injected via ldflags)
var (
	Version    = "dev"
	BuildName  = "local_build"
	BuildTime  = ""
	CommitHash = ""
	GoVersion  = ""
)

func main() {
	fmt.Println("🐦 Mockingbird - Starting...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Error loading config: %v\n", err)
		os.Exit(1)
	}

	// Set version information
	cfg.Version = Version
	cfg.BuildName = BuildName
	cfg.BuildTime = BuildTime
	cfg.CommitHash = CommitHash
	cfg.GoVersion = GoVersion

	fmt.Printf("Config directory: %s\n", cfg.ConfigDir)
	fmt.Printf("Proxy port: %d\n", cfg.ProxyPort)
	fmt.Printf("Admin port: %d\n", cfg.AdminPort)

	// Initialize store
	st, err := store.New(cfg.ConfigDir, cfg)
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
		if err := proxyServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Proxy server error: %v\n", err)
		}
	}()

	go func() {
		if err := adminServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Admin server error: %v\n", err)
		}
	}()

	fmt.Println("\n✅ Mockingbird is ready!")
	fmt.Println("---")
	fmt.Printf("📍 🚀 Proxy:  http://localhost:%d\n", cfg.ProxyPort)
	fmt.Printf("📍 ✧˖°Dashboard: http://localhost:%d\n", cfg.AdminPort)
	fmt.Printf("📍 Admin API: http://localhost:%d/api\n", cfg.AdminPort)
	fmt.Printf("📍 Health:    http://localhost:%d/health\n", cfg.AdminPort)
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
