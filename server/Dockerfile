
FROM node:21-alpine

WORKDIR /app

COPY package.json ./

RUN npm install
RUN npm install express
RUN npm install cors
RUN npm install dotenv
RUN npm install -g cross-env


COPY . .

EXPOSE 3001

# Use script specified in package,json
CMD ["npm", "run","start-server"]