import * as authClient from '@be-link/auth-sdk'
import shieldConfigManager from '../config/shieldConfigManager'

// 路由白名单
const whiteListInterface = []

export function authMiddleware() {
  return authClient.createAuthMiddleware({
    globalConfig: {
      getServerTokenSwitch: () => shieldConfigManager.dynamicConfig.serverTokenKeySwitch,
      getTokenKeyForWard: () => shieldConfigManager.dynamicConfig.tokenKeyForward,
      getTokenKey: () => shieldConfigManager.dynamicConfig.tokenKey,
      getTokenKeyBackUp: () => shieldConfigManager.dynamicConfig.tokenKeyBackUp,
      getOutOfTimeTimeStamp: () => shieldConfigManager.dynamicConfig.outOfTimeTimeStamp,
    },
    whiteListInterface,
    config: {
      JWT_SECRET: shieldConfigManager.config.SERVICE_DECRYPT.JWT_SECRET,
      DECRYPT_DATA_SECRET: shieldConfigManager.config.SERVICE_DECRYPT.SECRET,
      DECRYPT_DATA_OFFSET: shieldConfigManager.config.SERVICE_DECRYPT.OFFSET,
      DECRYPT_DATA_SECRET_NEW: shieldConfigManager.config.SERVICE_DECRYPT.SECRET_NEW,
    },
  })
}
