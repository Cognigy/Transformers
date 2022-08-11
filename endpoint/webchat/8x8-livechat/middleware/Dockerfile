FROM node:12.13.1-alpine

WORKDIR /api

COPY package*.json /api/

RUN npm i

COPY . /api

EXPOSE 8181

CMD ["node", "src/app.js"]

