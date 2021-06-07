FROM node:current-alpine

ENV NODE_ENV=production \
    TZ=Asia/Jakarta

RUN mkdir /app
WORKDIR /app

RUN apk add tzdata \
    && rm -rf /var/cache/apk/*

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

CMD ["node", "index.js"]