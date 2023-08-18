FROM node:lts-alpine
ENV NODE_ENV=production

# Create the directory!
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Copy and install our app
COPY package*.json ./
USER node
RUN npm install

# Copy the app's files
COPY --chown=node:node . .

# Start the app
CMD ["npm", "run", "start"]