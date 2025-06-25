package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"html/template"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

// Global server instance for graceful shutdown
var server *http.Server

var tmpl = template.Must(template.ParseGlob("index.html"))

func main() {
	// Start the server
	log.Println("Starting server on http://localhost:3000")

	// Set up the router and routes
	mux := http.NewServeMux()

	// Middleware for CORS
	mux.HandleFunc("/", applyCORS(serveIndex))
	mux.HandleFunc("/static/", applyCORS(proxyStatic))
	mux.HandleFunc("/assets/", applyCORS(serveAssets))
	mux.HandleFunc("/api/", applyCORS(proxyToBackend))
	mux.HandleFunc("/agi/", applyCORS(proxyToBackend))
	mux.HandleFunc("/search/", applyCORS(proxyToBackend))

	// Create and start the server
	server = &http.Server{
		Addr:    ":3000",
		Handler: mux,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown handling
	shutdownGracefully()
}

// Graceful shutdown logic
func shutdownGracefully() {
	// Create a channel to listen for OS signals (e.g., SIGINT, SIGTERM)
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Wait for a termination signal
	<-sigChan

	log.Println("Shutting down server gracefully...")

	// Set a timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server Shutdown Failed: %v", err)
	}

	log.Println("Server exited gracefully.")
}

// Apply CORS middleware to every request
func applyCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		enableCORS(w, r)

		// Call the next handler in the chain
		next(w, r)
	}
}

// Serve index.html on the / endpoint
func serveIndex(w http.ResponseWriter, r *http.Request) {
	// log.Println("Serving index.html on /")
	// http.ServeFile(w, r, "./index.html")
	tmpl.ExecuteTemplate(w,"index.html",nil)
}

// Proxy static files to localhost:4000
func proxyStatic(w http.ResponseWriter, r *http.Request) {
	staticURL, err := url.Parse("http://localhost:4000")
	if err != nil {
		log.Fatalf("Failed to parse static file server URL: %v", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(staticURL)
	log.Printf("Proxying static request to localhost:4000: %s", r.URL.Path)
	proxy.ServeHTTP(w, r)
}

// Serve assets files from the /assets directory
func serveAssets(w http.ResponseWriter, r *http.Request) {
	// Strip "/assets/" from the path and serve the file from the "./assets" directory
	path := strings.TrimPrefix(r.URL.Path, "/assets/")
	log.Printf("Serving assets file: %s", path)
	http.ServeFile(w, r, "./assets/"+path)
}

// General proxy handler for /api, /agi, and /search paths
func proxyToBackend(w http.ResponseWriter, r *http.Request) {
	// Modify the request path to point to localhost:4000 or another backend service
	backendURL := "http://localhost:4000" + r.URL.Path

	// Create a new request for the backend server
	req, err := http.NewRequest(r.Method, backendURL, r.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create request: %v", err), http.StatusInternalServerError)
		return
	}

	// Copy headers from the incoming request to the new request
	for key, values := range r.Header {
		if key != "Host" && key != "Content-Length" {
			for _, value := range values {
				req.Header.Add(key, value)
			}
		}
	}

	// Create a new HTTP client to send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to send request to backend: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Copy the response status code and body to the original response
	w.WriteHeader(resp.StatusCode)
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to read backend response: %v", err), http.StatusInternalServerError)
		return
	}
	w.Write(body)
}

// Function to enable CORS by setting necessary headers
func enableCORS(w http.ResponseWriter, r *http.Request) {
	// Allow any origin (or specify your allowed origins)
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Allow specific HTTP methods (GET, POST, OPTIONS, etc.)
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

	// Allow specific headers in requests (you can adjust this based on your needs)
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Requested-With, Authorization")

	// Expose the necessary headers to the client (you can add others as needed)
	w.Header().Set("Access-Control-Expose-Headers", "Content-Type, X-Requested-With, Authorization")

	// If it's a preflight OPTIONS request, respond with a 200 status code
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
}
