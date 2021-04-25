FROM node:current-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

RUN apk add --update sqlite && rm -rf /var/cache/apk/*
RUN mkdir db
RUN sqlite3 db/berlin.db "VACUUM;"

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

CMD ["node", "index.js"]