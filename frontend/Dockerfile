FROM node:lts-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .
ARG BACKEND_URL=https://localhost:8000
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["npm", "start"]