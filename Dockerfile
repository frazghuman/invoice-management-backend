From node:20.11.0-alpine3.19
Workdir /opt/
Copy ./ ./
RUN npm install -g @angular/cli
RUN npm install
RUN npm run build
CMD ["npm","run","serve:ssr:invoice-management"]
