import path from 'path'

const env = process.env

const envConfig = {
  TZ: env.TZ || 'Asia/Shanghai',
  NODE_ENV: env.NODE_ENV || 'development',
  CONFIGURATION_KEY: env.CONFIGURATION_KEY || 'ECS',
  CONTAINER_ENV: env.CONTAINER_ENV || 'CLOUD_RUN',
  // mysql
  MYSQL_POOL_MAX: Number(env.MYSQL_POOL_MAX) || 5,
  // mysql从库
  MYSQL_POOL_MAX_SLAVE: Number(env.MYSQL_POOL_MAX_SLAVE) || 5,
  // 工程根路径(demo目录)
  ROOT_PATH: path.resolve(__dirname),
  // 远程配置模块加载时间间隔(秒)
  FETCH_INTERVAL_SECONDS: Number(env.FETCH_INTERVAL_SECONDS) || 3,
}

export default envConfig
