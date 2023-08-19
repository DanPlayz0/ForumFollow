FROM node:lts-alpine
ENV NODE_ENV=production

# Create the directory!
RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app

# Copy and install our app
COPY package*.json ./
USER node
RUN npm install

# Copy the app's files
COPY --chown=node:node . .

# Start the app
CMD ["npm", "run", "start"]