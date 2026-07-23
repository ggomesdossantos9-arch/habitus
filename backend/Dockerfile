FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY . .

EXPOSE 8080

ENV NODE_ENV=production

CMD ["npm", "run", "start"]
