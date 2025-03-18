/**
 * 描述：用于单测初始化 mock，解除单测对第三方和组件的依赖，包含云函数的依赖和对数据库，redis，mq等的依赖。
 * 使用：单测文件中引入该文件。使用被劫持的外部依赖时(proxy)，需要注意必须先实现mock方法，否则会抛出异常；基础组件则不需要mock。
 * 细节：劫持依赖导入行为，注入mock对象，mock对象的创建和清理在 MockInit 类中实现，注意导入是default还是具名方法，实现mock细节有所不同。
 */

import { DataSource } from 'typeorm'
import fs from 'fs'
import path from 'path'
import * as redisClient from '../../src/ecs/core/connection/redis'
import * as logger from '../../src/ecs/utils/logger'
import Redis from 'ioredis-mock'

const vendorFiles = fs
  .readdirSync(path.join(__dirname, '../../src/demo/vendors'))
  .filter((item: string) => item.endsWith('.ts'))

/** 创建代理对象 */
function createMockProxy(target: any, filePath: string) {
  return new Proxy(target, {
    get(target, key) {
      if (!target.mockMap) target.mockMap = {}
      if (typeof target[key] === 'function' && !target.mockMap[key]) {
        throw new Error(`Please mock ${String(filePath)}#${String(key)}`)
      }
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      if (!target.mockMap) target.mockMap = {}
      if (!target.mockMap[key] && jest.isMockFunction(value)) {
        target.mockMap[key] = true
        target[key] = value
      }
      return Reflect.set(target, key, value)
    },
  })
}

const mockMap: Record<string, MockInit> = {}

/** base mock */
abstract class MockInit {
  dependencePath: string
  alias: string
  mockObj: any
  abstract mock(): any
  abstract clear(): void
}

/** db Mock */
class DbMock extends MockInit {
  private dataSource: DataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [path.join(__dirname, '../../src/demo/core/entity/**/*')],
    logging: ['error'],
    logger: 'advanced-console',
    synchronize: true,
  })

  dependencePath = path.join(__dirname, '../../src/demo/core/connection/database')
  alias: string = 'getBeLinkDataSource'

  mock() {
    this.mockObj = jest.fn(async () => {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize()
        await this.dataSource.query('PRAGMA foreign_keys=OFF')
      }
      return this.dataSource
    })
    return this.mockObj
  }

  clear(): void {}
}
const dbMock = new DbMock()
mockMap[dbMock.alias] = dbMock

/** redis Mock */
class RedisClientMock extends MockInit {
  dependencePath: string = path.join(__dirname, '../../src/demo/core/connection/redis')

  alias: string = 'redisClient'

  mock() {
    const mockRedisClient = new Redis()
    redisClient.setupLuaScript(mockRedisClient)
    this.mockObj = new Proxy(redisClient, {
      get(target, key) {
        if (key === 'default') return mockRedisClient
        if (key === 'getRedisInstance') return jest.fn(() => mockRedisClient)
        return Reflect.get(target, key)
      },
    })
    return this.mockObj
  }

  clear(): void {}
}
const redisClientMock = new RedisClientMock()
mockMap[redisClientMock.alias] = redisClientMock

/** rabbit channel Mock */
class RabbitChannelMock extends MockInit {
  dependencePath: string = path.join(
    __dirname,
    '../../src/demo/consumer/asyncTask/connection/rabbitmq.ts',
  )

  alias: string = 'createChannelWithTopic'

  mock() {
    this.mockObj = {
      createChannelWithTopic: jest.fn(() => ({ publish: jest.fn(() => true) })),
    }
    return this.mockObj
  }

  clear(): void {}
}
const rabbitChannelMock = new RabbitChannelMock()
mockMap[rabbitChannelMock.alias] = rabbitChannelMock

/** logger mock */
class LoggerMock extends MockInit {
  dependencePath: string = path.join(__dirname, '../../src/demo/utils/logger.ts')

  alias: string = 'logger'

  private LoggerMock = class Logger {
    /** 组装上报的context */
    private composeContext(content: { [key: string]: any } | string): {
      [key: string]: any
    } {
      // @ts-ignore
      let context: { [key: string]: any } = null
      if (typeof content === 'string') {
        context = {
          message: content,
        }
      } else {
        context = content
      }
      return context
    }

    /**
     * 输出普通级别信息
     * @param content 日志输出内容, 可为对象或字符串
     * @returns
     */
    public async info(content: { [key: string]: any } | string) {
      const context = this.composeContext(content)
      context.level = 'info'
      console.info(JSON.stringify(context))
    }

    /**
     * 输出警告级别信息
     * @param content 日志输出内容, 可为对象或字符串
     * @returns
     */
    public async warn(content: { [key: string]: any } | string) {
      const context = this.composeContext(content)
      context.level = 'warning'
      console.warn(JSON.stringify(context))
    }

    /**
     * 输出错误级别信息
     * @param content 日志输出内容, 可为对象或字符串
     * @param err 可选, 异常对象
     */
    public async error(content: { [key: string]: any } | string, err?: Error) {
      const context = this.composeContext(content)
      context.level = 'error'
      if (err) {
        context.errName = err.name
        context.errMessage = err.message
        context.errStack = err.stack
      }
      console.error(err?.stack)
    }
  }

  mock() {
    const LoggerMock = this.LoggerMock
    this.mockObj = new Proxy(logger, {
      get(target, key) {
        if (key === 'default') return jest.fn(() => new LoggerMock())
        if (key === 'Logger') return LoggerMock
        return Reflect.get(target, key)
      },
    })
    return this.mockObj
  }

  clear(): void {}
}
const loggerMock = new LoggerMock()
mockMap[loggerMock.alias] = loggerMock

/** mq Mock */
class MqProducerMock extends MockInit {
  dependencePath: string = path.join(__dirname, '../../src/demo/core/connection/mqProducer.ts')

  alias: string = 'MQProducer'

  private MqProducer = class MqProducer {
    private topic: string = ''
    async publish() {}
  }

  mock() {
    this.mockObj = { MQProducer: this.MqProducer }
    return this.mockObj
  }

  clear(): void {}
}
const mqProducerMock = new MqProducerMock()
mockMap[mqProducerMock.alias] = mqProducerMock

/** vendor Mock */
class VenderMock extends MockInit {
  dependencePath: string
  alias: string

  constructor(filePath: string, alias: string) {
    super()
    this.dependencePath = filePath
    this.alias = alias
  }

  mock() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const venderService = require(this.dependencePath).default
    this.mockObj = createMockProxy(venderService, this.alias)
    return this.mockObj
  }

  clear(): void {
    delete this.mockObj.mockMap
  }
}

vendorFiles.forEach((item: string) => {
  const venderMock = new VenderMock(
    path.join(__dirname, '../../src/demo/vendors', item),
    item.replace('.ts', ''),
  )
  mockMap[venderMock.alias] = venderMock
})

// 劫持依赖导入行为，注入mock对象
for (const mockInstance of Object.values(mockMap)) {
  mockInstance.mock()
  jest.mock(mockInstance.dependencePath, () => {
    return mockInstance.mockObj
  })
}

export default function clearMock() {
  for (const mockInstance of Object.values(mockMap)) mockInstance.clear()
}

afterEach(clearMock)
