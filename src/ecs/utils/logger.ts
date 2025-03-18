/**
 * 日志辅助类
 * usage:
 *  const logger = getLogger()
 *
 *  function A(){
 *     logger.info('something...')
 *     logger.error('boom', new Error())
 *  }
 */

import * as rTracer from 'cls-rtracer'
import * as clsSdk from 'tencentcloud-cls-sdk-js'
import shieldConfigManager from '../config/shieldConfigManager'
import consumerAsyncLocalStorage from './consumerAsyncLocalStorage'
import { isObject, isString } from 'lodash'

class Logger {
  private client: clsSdk.AsyncClient
  private topicId: string

  private initLogClient() {
    if (!this.client) {
      this.client = new clsSdk.AsyncClient({
        endpoint: shieldConfigManager.config.CLS.ENDPOINT,
        secretId: shieldConfigManager.config.TENCENT.SECRET_ID,
        secretKey: shieldConfigManager.config.TENCENT.SECRET_KEY,
        sourceIp: shieldConfigManager.config.CLS.SOURCE_IP,
        retry_times: shieldConfigManager.config.CLS.RETRY_TIMES,
      })
    }
  }

  /**
   * 组装上报的context
   */
  private composeContext(content: Record<string, any> | string): Record<string, any> {
    let context: Record<string, any> = null

    if (typeof content === 'string') context = { message: content }
    else context = content

    return context
  }

  private async pushContext(context: { [key: string]: any }) {
    this.initLogClient()

    try {
      if (!context) throw new Error('入参不允许为空')
      if (!isObject(context)) throw new Error('参数类型必须为Object{}')

      const item = new clsSdk.LogItem()

      for (const key in context) {
        let value = context[key]

        // value为undefined时，需要额外处理
        if (!isString(value)) value = JSON.stringify(value) || 'undefined'

        item.pushBack(new clsSdk.Content(key, value))
      }

      // 不管什么日志，统一在上报时增加requestId
      item.pushBack(new clsSdk.Content('requestId', String(rTracer.id())))

      // 异步消息id
      if (consumerAsyncLocalStorage.traceMessageId)
        item.pushBack(
          new clsSdk.Content('traceMessageId', consumerAsyncLocalStorage.traceMessageId),
        )

      item.setTime(Date.now())

      const logGroup = new clsSdk.LogGroup()
      logGroup.addLogs(item)

      const request = new clsSdk.PutLogsRequest(this.topicId, logGroup)

      this.client.PutLogs(request).catch((err) => {
        console.error('日志输出异常: ', JSON.stringify(context), err)
      })
    } catch (err) {
      console.error('日志输出异常: ', JSON.stringify(context), err)
    }
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
    this.pushContext(context)
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
    this.pushContext(context)
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
    this.pushContext(context)
  }
}

export default function getLogger(): Logger {
  return new Logger()
}
