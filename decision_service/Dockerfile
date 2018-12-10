FROM node:11

WORKDIR /decision_service
COPY . /decision_service

RUN npm install

EXPOSE 9090

CMD ["npm", "start"]