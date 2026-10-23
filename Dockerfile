# FaceVote — full app (Express API + built frontend) in one container.
# Works on any Docker host (Back4App Containers, Fly.io, Cloud Run, a VPS).
# The server reads its port from the PORT environment variable, which the
# hosting platform assigns.
FROM node:20-slim

WORKDIR /app

# Install first (better layer caching). Dev dependencies are required
# because vite/esbuild run during the build step.
COPY package.json ./
RUN npm install --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
