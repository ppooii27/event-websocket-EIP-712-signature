FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY server/ ./server/

RUN npm run build

EXPOSE 8765 9090

CMD ["node", "dist/server/server.js"]
