import cloudbase from '@cloudbase/node-sdk'
import getLogger from '../utils/logger'
import shieldConfigManager from '../config/shieldConfigManager'

const _LOGGER = getLogger()

export type callFunctionRequest = {
  moduleName?: string
  serviceName?: string
  apiName?: string
  funcName: string
  param: any
}

export type callFunctionResponse = {
  result: {
    success: boolean
    data: any
    msg: string
    errorCode: number
  }
}

export class ScfClientError extends Error {
  errCode: number
  constructor(message: string, errCode?: number) {
    super(message)
    this.name = 'ScfClientError'
    this.errCode = errCode
  }
}

export default abstract class ScfClient {
  private app: cloudbase.CloudBase
  protected abstract functionName: string

  constructor() {}

  protected async callFunction(request: callFunctionRequest): Promise<any> {
    if (!this.app) {
      this.app = cloudbase.init({
        env: shieldConfigManager.config.TENCENT.SCF,
        secretId: shieldConfigManager.config.TENCENT.SECRET_ID,
        secretKey: shieldConfigManager.config.TENCENT.SECRET_KEY,
      })
    }

    // 打印耗时, 开始时间
    const start = Date.now()
    const res = await this.app.callFunction({
      name: this.functionName,
      data: request,
    })
    const result = res as callFunctionResponse & { requestId: string }
    // 打印耗时, 结束时间
    const end = Date.now()

    _LOGGER.info({
      message: '调用SCF接口耗时',
      url: `${request.moduleName}.${request.serviceName}.${request.funcName || request.apiName}`,
      timeCost: end - start,
      scfRequestId: result.requestId,
    })

    if (!result.result.success)
      throw new ScfClientError(`访问SCF异常: ${result.result.msg}`, result.result.errorCode)

    return result.result.data
  }
}
