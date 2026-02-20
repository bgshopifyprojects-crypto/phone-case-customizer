FROM node:20-alpine
RUN apk add --no-cache \
    openssl \
    python3 \
    py3-pip \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    py3-numpy \
    py3-opencv

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Install Python dependencies for phoneLayer
RUN pip3 install --no-cache-dir -r phoneLayer/requirements.txt --break-system-packages

RUN npm run build

# Create prisma directory if it doesn't exist (for volume mount)
RUN mkdir -p /app/prisma

CMD ["npm", "run", "docker-start"]
