# Product CI publishes tip images for CP release roll (ACC-F11).
FROM node:22-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY openapi ./openapi
ARG AICP_GIT_SHA=unknown
ENV PORT=8080
ENV NODE_ENV=production
ENV AICP_GIT_SHA=${AICP_GIT_SHA}
EXPOSE 8080
CMD ["node", "src/server.js"]
