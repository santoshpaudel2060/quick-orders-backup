FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build TS
RUN npm run build

# Run compiled JS
CMD ["node", "dist/index.js"]
