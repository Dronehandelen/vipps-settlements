FROM node:14

# Create app directory
WORKDIR /var/www/app

COPY . .

RUN yarn install

EXPOSE 80
