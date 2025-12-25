# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# Build backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache git
COPY api/go.mod api/go.sum ./
RUN go mod download
COPY api/ .
RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o api .

# Final image
FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/api .
COPY --from=backend-builder /app/migrations ./migrations

# Copy frontend static files
COPY --from=frontend-builder /web/dist ./static

# Create 404.html for SPA fallback (GoFr serves this for missing routes)
RUN cp ./static/index.html ./static/404.html

RUN mkdir -p configs
EXPOSE 8080
CMD ["./api"]
