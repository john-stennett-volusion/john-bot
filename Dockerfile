FROM node:argon

# Create the app directory.
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install BotKit.
RUN npm install botkit --save
COPY robot.js /usr/src/app/
COPY package.json /usr/src/app

# Set the startup commands.
CMD ["npm", "start"]