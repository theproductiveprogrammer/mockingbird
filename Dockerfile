# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o mockingbird ./cmd/server

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/mockingbird .

# Create config directory
RUN mkdir -p /app/config

# Expose ports
EXPOSE 8769 8768

# Set environment variables
ENV MOCKINGBIRD_CONFIG_DIR=/app/config

# Run
CMD ["./mockingbird"]
