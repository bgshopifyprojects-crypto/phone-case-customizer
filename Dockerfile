FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN npm run build

# Create prisma directory if it doesn't exist (for volume mount)
RUN mkdir -p /app/prisma

CMD ["npm", "run", "docker-start"]
