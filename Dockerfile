FROM node:14-alpine as runner
COPY . .
RUN npm install
EXPOSE 3000
ENTRYPOINT ["node", "./src/index.js"]
