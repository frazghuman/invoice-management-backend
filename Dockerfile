From node:20.11.0-alpine3.19
Workdir /opt/
Copy ./ ./
RUN npm install -g @nestjs/cli
RUN npm install
RUN npm run build
CMD ["npm","run","start:dev"]
