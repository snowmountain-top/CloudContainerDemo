import { DataSource } from 'typeorm'
import path from 'path'
import envConfig from '../../settings'
import envUtils from '../../utils/env'
import shieldConfigManager from '../../config/shieldConfigManager'

let masterDataSource: DataSource = null

let slaveDataSource: DataSource = null

export async function init() {
  masterDataSource = new DataSource({
    type: 'mysql',
    database: shieldConfigManager.config.SQL.MASTER.DATABASE,
    host: shieldConfigManager.config.SQL.MASTER.HOST,
    port: shieldConfigManager.config.SQL.MASTER.PORT,
    username: shieldConfigManager.config.SQL.MASTER.USER,
    password: shieldConfigManager.config.SQL.MASTER.PASSWORD,
    charset: 'utf8mb4',
    timezone: '+08:00',
    entities: [path.join(__dirname, '../entity/**/*')],
    subscribers: [path.join(__dirname, '../entity/subscriber/**/*')],
    poolSize: envConfig.MYSQL_POOL_MAX,
    bigNumberStrings: false,
    connectTimeout: 5000,
    // acquireTimeout: 5000,
    logging: envUtils.isProduction() ? ['error'] : true,
    logger: 'advanced-console',
    extra: {
      connectionLimit: envConfig.MYSQL_POOL_MAX,
      maxIdle: 0,
      waitForConnections: true,
      idleTimeout: 500,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    },
  })
  slaveDataSource = new DataSource({
    type: 'mysql',
    database: shieldConfigManager.config.SQL.SLAVE.DATABASE,
    host: shieldConfigManager.config.SQL.SLAVE.HOST,
    port: shieldConfigManager.config.SQL.SLAVE.PORT,
    username: shieldConfigManager.config.SQL.SLAVE.USER,
    password: shieldConfigManager.config.SQL.SLAVE.PASSWORD,
    timezone: '+08:00',
    entities: [path.join(__dirname, '../entity/**/*')],
    subscribers: [path.join(__dirname, '../entity/subscriber/**/*')],
    poolSize: envConfig.MYSQL_POOL_MAX_SLAVE,
    bigNumberStrings: false,
    connectTimeout: 5000,
    // acquireTimeout: 5000,
    logging: envUtils.isProduction() ? ['error'] : true,
    logger: 'advanced-console',
    extra: {
      connectionLimit: envConfig.MYSQL_POOL_MAX_SLAVE,
      maxIdle: 0,
      waitForConnections: true,
      idleTimeout: 500,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    },
  })

  // 启动时初始化数据源，防止服务启动时 no metadata found 的异常
  await initDataSource(masterDataSource)

  if (envUtils.isProduction()) await initDataSource(slaveDataSource)
}

/** 初始化数据源 */
async function initDataSource(dataSource: DataSource) {
  if (dataSource.isInitialized) return
  await dataSource.initialize()
}

export default async function getBeLinkDataSource(fromSlave = false) {
  const dataSource = fromSlave
    ? envUtils.isProduction()
      ? slaveDataSource
      : masterDataSource
    : masterDataSource
  await initDataSource(dataSource)
  return dataSource
}
