import { Redis } from 'ioredis'
import redisInstance from '../core/connection/redis'
import stringUtils from '@be-link/common-sdk/utils/string'
import getLogger from './logger'

const _LOGGER = getLogger()

interface IRedisLockConfig {
  client?: Redis
  lockKey: string
  lockValueLen?: number
  lockExpire?: number
}

export default class RedisLock {
  private static defaultConfig = {
    client: redisInstance,
    lockValueLen: 10,
    lockExpire: 5,
  }

  private client: Redis
  private lockKey: string
  private lockValue: string
  private lockExpire: number

  constructor(config: IRedisLockConfig) {
    const { client, lockKey, lockValueLen, lockExpire } = Object.assign(
      {},
      RedisLock.defaultConfig,
      config,
    )
    if (!client || !lockKey || !lockValueLen || !lockExpire) {
      throw new Error('RedisLock config error')
    }

    this.client = client
    this.lockKey = lockKey
    this.lockValue = stringUtils.randomString(lockValueLen)
    this.lockExpire = lockExpire
  }

  async lock(): Promise<boolean> {
    const lockRes = await this.client.set(this.lockKey, this.lockValue, 'EX', this.lockExpire, 'NX')
    return lockRes === 'OK'
  }

  async unlock() {
    const value = await this.client.get(this.lockKey)
    let delNum = 0
    if (value === this.lockValue) {
      const delRes = await this.client.del(this.lockKey)
      delNum = delRes
    }
    if (!delNum) _LOGGER.warn(`RedisLock unlock error, lockKey: ${this.lockKey}`)
  }

  getLockValue() {
    return this.client.get(this.lockKey)
  }
}
