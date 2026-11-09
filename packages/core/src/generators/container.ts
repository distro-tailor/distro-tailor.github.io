import { GeneratedRecipe, UserCriteria } from '../types.js';

export function generateContainerRecipe(criteria: UserCriteria): GeneratedRecipe {
  const dockerfileContent = `# ==============================================================================
# DistroTailor: Multi-Stage Ultra-Minimal Distroless Container
# Target: Sub-10MB, non-root, zero shell, zero package manager
# ==============================================================================

# Build Stage (Provides compilation toolchain)
FROM golang:1.23-alpine AS builder

WORKDIR /src
COPY <<EOF main.go
package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from DistroTailor Distroless Container!\\n")
	})
	fmt.Printf("Server listening on :%s...\\n", port)
	http.ListenAndServe(":"+port, nil)
}
EOF

# Compile statically linked binary (zero C library runtime dependencies)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o app main.go

# Final Runtime Stage: Pure Scratch / Distroless
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /
COPY --from=builder /src/app /app

USER nonroot:nonroot
EXPOSE 8080

ENTRYPOINT ["/app"]
`;

  return {
    id: 'distroless-docker',
    title: 'Zero-CVE Distroless Container (Static Multi-Stage)',
    summary:
      'Generates a multi-stage container image with zero shell, zero package manager, and a non-root user for security-first cloud workloads.',
    targetFormat: 'dockerfile',
    estimatedBuildTimeMinutes: 1,
    hostDependencies: ['docker', 'or podman'],
    files: [
      {
        filename: 'Dockerfile',
        description: 'Multi-stage build compiling a static binary and deploying to distroless:nonroot',
        content: dockerfileContent
      }
    ],
    quickstartCommands: [
      'docker build -t tailored-app:latest .',
      'docker run -p 8080:8080 --rm tailored-app:latest'
    ]
  };
}
