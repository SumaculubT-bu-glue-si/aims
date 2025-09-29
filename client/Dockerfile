# Use a Node.js image suitable for Next.js development
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files only
# We copy package*.json BEFORE running npm install to leverage Docker's build cache
COPY package*.json ./

# Install ALL dependencies (for development and building)
# Using 'npm install' ensures devDependencies are present for 'npm run dev'
RUN npm install

# Copy the rest of the application code
# This step is mostly symbolic; the volume mount in docker-compose overrides it.
COPY . .

# Expose the development port
EXPOSE 3000

# The CMD is set to a simple process. The docker-compose.yml will override this 
# with the 'npm run dev' command for live reloading.
CMD ["npm", "run", "dev"]