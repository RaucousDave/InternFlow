FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
EXPOSE 8000
CMD ["bun", "src/index.ts"]
