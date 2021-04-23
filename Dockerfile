FROM node:current-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production


# ffmpeg
RUN apk add  --no-cache ffmpeg
RUN ffmpeg

COPY . .

CMD ["node", "index.js"]
