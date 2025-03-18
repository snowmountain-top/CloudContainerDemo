require('express-async-errors')
import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import rTracer from 'cls-rtracer'
import envConfig from '../settings'
import * as remoteConfig from '../config/remoteConfig'
import cors from 'cors'

// 堆栈信息转换
import * as sourceMapSupport from 'source-map-support'

import { logResponseRes, errorLogger } from '../middleware/logger'
import { injectUserInfo } from '../middleware/injectUserInfo'
import * as databaseService from '../core/connection/database'
import * as redisService from '../core/connection/redis'
import { authMiddleware } from '../middleware/auth'
import shieldConfigManager from '../config/shieldConfigManager'

sourceMapSupport.install()

async function main() {
  const app = express()

  await register()
  setupMiddleware(app)
  setupRoutes(app)
  setupErrorHandler(app)

  const server = app.listen(shieldConfigManager.config.API_PORT, () => {
    console.log(`Server running on port ${shieldConfigManager.config.API_PORT}`)
  })

  // 设置tcp连接超时时长
  server.keepAliveTimeout = 61 * 1000
  server.headersTimeout = 65 * 1000
}

// 仅需在服务启动时调用一次, 无需调用多次
export async function register() {
  await shieldConfigManager.setup()

  // 启动时初始化数据源
  await Promise.all([databaseService.init(), redisService.getRedisInstance()])

  // 启动远程配置模块
  await Promise.all([remoteConfig.switchInstance.fetch(), remoteConfig.configInstance.fetch()])

  // 启动定时更新缓存
  const timer = setInterval(function () {
    remoteConfig.switchInstance.fetch()
    remoteConfig.configInstance.fetch()
    shieldConfigManager.fetch()
  }, 1000 * envConfig.FETCH_INTERVAL_SECONDS)
  console.info('远程配置模块加载成功')

  process.on('exit', () => clearInterval(timer))
  process.on('uncaughtException', () => clearInterval(timer))
}

export function setupMiddleware(app: express.Application) {
  // 跨域
  app.use(cors())

  // 使用rTracer，为了在请求链路中生成追踪Id
  app.use(rTracer.expressMiddleware({ useHeader: true, headerName: 'X-Request-Id' }))

  // post body 按照JSON解析
  app.use(bodyParser.json())

  // 解析urlencoded form data
  app.use(bodyParser.urlencoded({ extended: false }))

  // 服务请求日志输出
  app.use(logResponseRes())

  // 注入用户信息
  app.use(injectUserInfo())

  // 鉴权
  app.use(authMiddleware())
}

export function setupRoutes(app: express.Application) {
  app.get('/', async function (req: Request, res: Response) {
    res.json({ message: 'Hello World' })
  })
}

export function setupErrorHandler(app: express.Application) {
  // 全局异常日志
  app.use(errorLogger())

  // 处理未处理的路由
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: 'URL not found' })
  })
}

main()
