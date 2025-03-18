require('express-async-errors')
import envConfig from '../settings'

// 堆栈信息转换
import * as sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import * as remoteConfig from '../config/remoteConfig'
import * as databaseService from '../core/connection/database'
import * as redisService from '../core/connection/redis'

import AsyncActionConsumerClassList from './asyncTask'
import shieldConfigManager from '../config/shieldConfigManager'

const TotalConsumeClassList = [...AsyncActionConsumerClassList]

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

async function init() {
  await register()

  // 启动消费者
  for (const ConsumerClass of TotalConsumeClassList) {
    const consumer = new ConsumerClass()
    consumer.startConsumer()
  }
}

init()
