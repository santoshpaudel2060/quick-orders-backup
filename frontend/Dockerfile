# Use Debian-based Node (compatible with Tailwind)
FROM node:20-bullseye

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# # Build Next.js frontend
# RUN npm run build
# Build Next.js frontend using env variables
ARG NEXT_PUBLIC_API_URL
RUN NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL npm run build


EXPOSE 3000

# Start in production
CMD ["npm", "start"]
