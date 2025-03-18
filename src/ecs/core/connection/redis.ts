import Redis from 'ioredis'
import shieldConfigManager from '../../config/shieldConfigManager'

const globalLuaConfig = {
  demo: {
    numberOfKeys: 1,
    lua: `
      return 1
    `,
  },
}

let _REDIS_INSTANCE: Redis & { [K in keyof typeof globalLuaConfig]?: (...args: any[]) => any } =
  null

// 获取redis实例
export function getRedisInstance(db?: number) {
  if (!db) db = shieldConfigManager.config.REDIS.DB

  if (!_REDIS_INSTANCE) {
    _REDIS_INSTANCE = new Redis(
      shieldConfigManager.config.REDIS.PORT,
      shieldConfigManager.config.REDIS.HOST,
      { password: shieldConfigManager.config.REDIS.PASSWORD, db },
    )

    setupLuaScript(_REDIS_INSTANCE)
  }

  return _REDIS_INSTANCE
}

// 设置lua脚本
function setupLuaScript(redisInstance: Redis, luaConfig = globalLuaConfig) {
  for (const [key, value] of Object.entries(luaConfig)) redisInstance.defineCommand(key, value)
}

const redisInstance = new Proxy(
  {},
  {
    get(target, prop, receiver) {
      return Reflect.get(_REDIS_INSTANCE, prop, receiver)
    },
  },
)

// export default redisInstanceWrapper.getInstance()
export default redisInstance as Redis & {
  [K in keyof typeof globalLuaConfig]?: (...args: any[]) => any
}
