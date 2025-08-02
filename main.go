package main

import (
	"compress/gzip"
	"context"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

// Global server instance
var server *http.Server
var tmpl = template.Must(template.ParseGlob("dist/index.html"))

func main() {
	log.Println("🚀 Starting server on http://localhost:3000")

	mux := http.NewServeMux()

	// Apply middleware chain
	handler := applyLogging(applyCompression(applyCORS(frontendRouter)))

	mux.HandleFunc("/", handler)

	server = &http.Server{
		Addr:    ":3000",
		Handler: mux,
	}

	// Run server in a goroutine
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server failed: %v", err)
		}
	}()

	shutdownGracefully()
}

func shutdownGracefully() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("🧘 Shutting down gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("⚠️ Shutdown error: %v", err)
	}
	log.Println("✅ Server exited cleanly")
}

// Main routing logic
func frontendRouter(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	switch {
	case strings.HasPrefix(path, "/static"), strings.HasPrefix(path, "/api"):
		proxyToBackend(w, r)
	case strings.HasPrefix(path, "/assets/"):
		serveAssets(w, r)
	default:
		serveIndex(w, r)
	}
}

// Serve index.html
func serveIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "public, max-age=3600")
	tmpl.ExecuteTemplate(w, "index.html", nil)
}

// Serve /assets files
func serveAssets(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/assets/")
	file := "./dist/assets/" + path

	// Set correct MIME type for .css files
	if strings.HasSuffix(path, ".css") {
		w.Header().Set("Content-Type", "text/css")
	} else if strings.HasSuffix(path, ".js") {
		w.Header().Set("Content-Type", "application/javascript")
	}

	// Cache and serve file
	w.Header().Set("Cache-Control", "public, max-age=86400")
	http.ServeFile(w, r, file)
}

// Proxy to backend
func proxyToBackend(w http.ResponseWriter, r *http.Request) {
	backendURL := "http://localhost:4000" + r.URL.Path
	req, err := http.NewRequest(r.Method, backendURL, r.Body)
	if err != nil {
		http.Error(w, "⚠️ Request creation failed", http.StatusInternalServerError)
		return
	}
	for k, v := range r.Header {
		for _, val := range v {
			req.Header.Add(k, val)
		}
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "⚠️ Backend request failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for k, v := range resp.Header {
		for _, val := range v {
			w.Header().Add(k, val)
		}
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// CORS middleware
func applyCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w, r)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Type, Authorization")
}

// Logging middleware
func applyLogging(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("📥 %s %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		next(w, r)
		log.Printf("⏱️ Completed in %v", time.Since(start))
	}
}

// Compression middleware
func applyCompression(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gzw := gzip.NewWriter(w)
		defer gzw.Close()
		gzwResponse := gzipResponseWriter{Writer: gzw, ResponseWriter: w}
		next(gzwResponse, r)
	}
}

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}
