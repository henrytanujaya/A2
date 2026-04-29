# Tahap 1: Build Frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Kita dapat melemparkan ENV variable saat build jika diperlukan, misal:
# ARG VITE_API_BASE_URL
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Tahap 2: Setup Nginx
FROM nginx:alpine
# Copy hasil build ke directory default nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
