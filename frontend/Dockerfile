FROM node:lts-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_BACKEND_URL=https://solx.abhideep.space
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

RUN npm run build
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["npm", "start"]