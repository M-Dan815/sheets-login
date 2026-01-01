# --------- Stage 1: Build ---------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend source code
COPY . .

# --------- Stage 2: Runtime ---------
FROM node:20-alpine

WORKDIR /app

# Copy installed node_modules and app code from builder
COPY --from=builder /app /app

# Expose the port your backend listens on
EXPOSE 5000

# Start the backend
CMD ["node", "server.js"]
