FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

ARG VITE_API_BASE_URL=/api/v1
ARG VITE_PUBLIC_APP_URL=http://localhost:8080
ARG VITE_GOOGLE_CLIENT_ID=

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_PUBLIC_APP_URL=${VITE_PUBLIC_APP_URL} \
    VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/frontend-nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
