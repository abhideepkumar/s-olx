FROM node:lts-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8000
CMD ["node", "/app/src/index.js"]