# ---- build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ARG VITE_PUBLIC_ORIGIN=
ENV VITE_PUBLIC_ORIGIN=$VITE_PUBLIC_ORIGIN

RUN npm run build

# ---- run ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
