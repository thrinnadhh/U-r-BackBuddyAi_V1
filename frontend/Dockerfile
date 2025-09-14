# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build with backend URL injected at build time
ARG REACT_APP_BACKEND_URL=http://localhost:8000
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


