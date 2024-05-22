# Use an official Node.js runtime as a parent image
FROM node:22

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json /app

# Copy the workspaces directory structure to enable workspace install
COPY packages ./packages

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . /app

# Expose the port the app runs on
EXPOSE 8080
EXPOSE 3333

# Run the app
CMD ["sh", "-c", "./wait-for-it.sh postgres:5432 -- npm run migrate:db && npm run dev"]
