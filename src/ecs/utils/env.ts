import envConfig from '../settings'

const envUtils = {
  // 环境判断
  isProduction() {
    return envConfig.NODE_ENV === 'prod'
  },
  isDevelopment() {
    return envConfig.NODE_ENV === 'development'
  },
  isTEST() {
    return envConfig.NODE_ENV === 'test'
  },
  isPPE() {
    return envConfig.NODE_ENV === 'ppe'
  },
}

export default envUtils
