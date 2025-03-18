# Build Stage
FROM node:18-bullseye-slim AS install-dependencies
COPY package*.json /webapp/ecs/
WORKDIR /webapp/ecs/
# 使用淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install -g pnpm
RUN pnpm install --ignore-scripts
RUN pnpm install pm2

# translate from TS to JS
FROM node:18-bullseye-slim AS build
COPY --from=install-dependencies /webapp/ecs /webapp/ecs
COPY ./src /webapp/ecs/src
COPY ./resources /webapp/ecs/resources
COPY ./tsconfig.json ./pm2.json /webapp/ecs/
WORKDIR /webapp/ecs
RUN npm run build

# Copy all files & Package
FROM node:18-bullseye-slim
COPY --from=build /webapp/ecs/node_modules /webapp/ecs/node_modules
COPY --from=build /webapp/ecs/package*.json /webapp/ecs/pm2.json /webapp/ecs/
# Copy project files
COPY --from=build /webapp/ecs/dist /webapp/ecs
WORKDIR /webapp/ecs
EXPOSE 8090
CMD npx pm2-runtime start pm2.json --output stdout
