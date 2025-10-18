# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source
COPY src/ ./src/

# Create iExec directories
RUN mkdir -p /iexec_in /iexec_out

# Set environment variables for iExec
ENV IEXEC_IN=/iexec_in
ENV IEXEC_OUT=/iexec_out

# Run the application
ENTRYPOINT ["node", "src/app.js"]
