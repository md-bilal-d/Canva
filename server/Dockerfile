FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend app
COPY . .

# SQLite database directory setup
RUN mkdir -p /data
ENV DATABASE_PATH=/data/whiteboard.db

EXPOSE 1234
CMD ["node", "index.js"]
