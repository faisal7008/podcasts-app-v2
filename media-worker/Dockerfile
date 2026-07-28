FROM node:24-alpine

# Install ffmpeg for audio processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY media-worker/package*.json ./media-worker/
COPY shared ./shared

RUN cd shared && npm install && npm run build

WORKDIR /app/media-worker
RUN npm install

COPY media-worker .
RUN npm run build

CMD ["npm", "start"]
