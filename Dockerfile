# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY index.html ./
COPY eslint.config.js ./

RUN npm install

COPY src ./src
COPY public ./public

RUN npm run build

# Etapa 2: Servir con nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html/frontend

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4300/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
