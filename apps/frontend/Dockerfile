FROM docker.io/library/node:24-alpine AS build

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci --workspace frontend

COPY apps/frontend ./apps/frontend
RUN npm run build --workspace frontend

FROM docker.io/library/nginx:1.27-alpine

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
