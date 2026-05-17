# Use the official Microsoft Playwright image which has Chromium and all dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the Next.js production bundle
RUN npm run build

# Next.js runs on port 3000 by default
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
