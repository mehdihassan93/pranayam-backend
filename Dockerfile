# Build stage
FROM node:25.9-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:25.9-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
