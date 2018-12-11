FROM node:11

WORKDIR /datafile_service
COPY . /datafile_service

RUN rm -rf node_modules
RUN npm install

EXPOSE 2222

CMD ["npm", "start"]