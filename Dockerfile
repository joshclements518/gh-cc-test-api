# Built from gh-cc-test-api tree — ACC-F11 dual-repo deployable
FROM node:22-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY openapi ./openapi
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/server.js"]
