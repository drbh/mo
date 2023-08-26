# Build stage: Use the official Deno image for compilation
FROM denoland/deno:latest as builder

# Set the working directory
WORKDIR /app

# Copy your Deno app to the Docker image
COPY server/main.ts server/main.ts

# copy ../common to the Docker image
COPY common common

# Compile your Deno app
RUN cd server && \
    deno compile \
    --unstable \
    --allow-net \
    --allow-write \
    --allow-read \
    --allow-env \
    main.ts

# Final stage: Use a lightweight image for running the compiled binary
FROM debian:buster-slim

# Copy the compiled binary from the build stage
COPY --from=builder /app/server/server /app/main

# Expose the port your app runs on
EXPOSE 3000

# Set the working directory
WORKDIR /app

# # # Run the compiled Deno app
CMD ["./main"]
