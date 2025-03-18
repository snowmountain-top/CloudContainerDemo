import * as shieldClient from '@be-link/shield-cli-nodejs'
import envConfig from '../settings'

export type ShieldConfig = {
  SERVICE_DECRYPT: {
    JWT_SECRET: string
    SECRET: string
    SECRET_NEW: string
    OFFSET: string
  }
  SQL: {
    MASTER: {
      DATABASE: string
      HOST: string
      PORT: number
      USER: string
      PASSWORD: string
    }
    SLAVE: {
      DATABASE: string
      HOST: string
      PORT: number
      USER: string
      PASSWORD: string
    }
  }
  REDIS: {
    HOST: string
    PORT: number
    PASSWORD: string
    DB: number
  }
  RABBITMQ: {
    HOST: string
    PORT: number
    USERNAME: string
    PASSWORD: string
    VHOST: string
  }
  TENCENT: {
    SECRET_ID: string
    SECRET_KEY: string
    SCF: string
  }
  ASYNC_TASK: {
    TOPIC: string
    ROUTING_KEY: string
    QUEUE: string
  }
  CLS: {
    TOPIC_ID: string
    ENDPOINT: string
    SOURCE_IP: string
    RETRY_TIMES: number
  }
  API_PORT: number
  PROJECT_NAME: string
  IP: string
}

class ShieldConfigManager {
  #config: ShieldConfig
  protected _dynamicConfig: Awaited<
    ReturnType<typeof shieldClient.shieldCoreService.fetchGlobalDynamicConfig>
  >

  async setup() {
    const config = await shieldClient.shieldCoreService.fetchConfig({
      key: envConfig.CONFIGURATION_KEY,
      type: 'yaml',
    })
    this.#config = config
  }

  get config() {
    return this.#config
  }

  get dynamicConfig() {
    return this._dynamicConfig
  }

  async fetch() {
    const dynamicConfig = await shieldClient.shieldCoreService.fetchGlobalDynamicConfig()
    process.env.authorizationTokenInside = dynamicConfig.tokenKey
    this._dynamicConfig = dynamicConfig
  }
}

const shieldConfigManager = new ShieldConfigManager()
export default shieldConfigManager
