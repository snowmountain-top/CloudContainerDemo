# Build Stage
FROM node:18-bullseye-slim AS install-dependencies
COPY package*.json /webapp/cs/
WORKDIR /webapp/cs/
# node version not support
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/
RUN npm install -g pnpm
RUN pnpm install --ignore-scripts
RUN pnpm install pm2

# translate from TS to JS
FROM node:18-bullseye-slim AS build
COPY --from=install-dependencies /webapp/ecs /webapp/ecs
COPY ./src /webapp/ecs/src
COPY ./tsconfig.json ./pm2.json /webapp/ecs/
WORKDIR /webapp/ecs
RUN npm run build

# Copy all files & Package
FROM node:18-bullseye-slim
COPY --from=build /webapp/ecs/node_modules /webapp/ecs/node_modules
COPY --from=build /webapp/ecs/package*.json /webapp/ecs/pm2.json /webapp/ecs/
# Copy project files
COPY --from=build /webapp/ecs/dist /webapp/ecs
COPY --from=build /webapp/ecs/resources /webapp/ecs/resources
WORKDIR /webapp/ecs
EXPOSE 8090
CMD npx pm2-runtime start pm2.json --output stdout
