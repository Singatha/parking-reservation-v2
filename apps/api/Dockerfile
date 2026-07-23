FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --omit=dev --workspace=@parking/api

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=dependencies /app/node_modules ./node_modules
COPY apps/api ./apps/api
USER app
EXPOSE 3000
CMD ["sh", "-c", "node apps/api/src/database/migrate.js && node apps/api/src/server.js"]
