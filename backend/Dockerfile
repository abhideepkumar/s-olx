FROM node:lts-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

FROM node:lts-alpine
WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8000
CMD ["node", "/app/src/index.js"]