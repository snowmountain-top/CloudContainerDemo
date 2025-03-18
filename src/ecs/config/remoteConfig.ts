import { isNaN, isUndefined } from 'lodash'
import redisInstance from '../core/connection/redis'

abstract class LocalCache {
  protected _localCache: Record<string, any> = {}
  protected _remoteDataKey: string

  constructor(key: string) {
    this._remoteDataKey = key
  }

  async fetch(): Promise<{ [key: string]: any }> {
    throw new Error('Not implement')
  }
}

/** 开关类 */
class Switch extends LocalCache {
  isSwitchOn(key: string): boolean {
    const data: any = this._localCache[key]
    if (!isNaN(data)) return Boolean(Number(data))

    return Boolean(data)
  }

  async fetch() {
    const remoteData = await redisInstance.hgetall(this._remoteDataKey)
    this._localCache = Object.assign({}, remoteData)
    return this._localCache
  }
}

/** 配置类 */
class Config extends LocalCache {
  get(key: string, defaultValue?: any): any {
    const result = this._localCache[key]
    return isUndefined(result) ? defaultValue : result
  }

  async fetch() {
    const remoteData = await redisInstance.hgetall(this._remoteDataKey)

    for (const key in remoteData) {
      try {
        this._localCache[key] = JSON.parse(remoteData[key])
      } catch {
        this._localCache[key] = remoteData[key]
      }
    }

    return this._localCache
  }
}

/**
 * 开关和配置的实例
 * ! 业务模块中不要直接引用, 请移步到src/core/config/biz-config.ts
 */
export const switchInstance = new Switch('ecs:switch:features')
export const configInstance = new Config('ecs:config:features')
