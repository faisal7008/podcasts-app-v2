FROM node:24-alpine

WORKDIR /app

COPY web/package*.json ./web/
COPY shared ./shared

RUN cd shared && npm install && npm run build

WORKDIR /app/web
RUN npm install

COPY web .
RUN npm run build

CMD ["npm", "start"]
