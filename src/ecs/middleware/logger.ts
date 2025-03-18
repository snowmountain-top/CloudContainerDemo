import express from 'express'
import getLogger from '../utils/logger'
import feishuNotifyInstance from '../utils/feishuNotify'
import BizError from '../errors/BizError'
import rTracer from 'cls-rtracer'

const LOGGER = getLogger()

// 响应体标准日志结构输出
export function logResponseRes() {
  return function (req: any, res: any, next: Function) {
    const url = req.url
    // 入口日志
    LOGGER.info({
      message: '接口请求',
      url,
      headers: JSON.stringify(req.headers),
      body: JSON.stringify(req.body),
      ip: req.ip,
    })
    req._startTime = Date.now()

    // 重写res.send方法
    const originalSendFunc = res.send
    res.send = function (body, ...args: any): any {
      const resultSize = JSON.stringify(body).length
      LOGGER.info({
        message: '接口返回值大小',
        result: resultSize,
      })
      // 打印res.send的返回值
      // 接口返回值大于 1048576 时，不打印
      LOGGER.info({
        message: '接口响应',
        url,
        headers: JSON.stringify(req.headers),
        body: JSON.stringify(req.body),
        result: resultSize > 1048576 ? '接口返回值过大，不打印' : body,
        ip: req.ip,
        timeCost: Date.now() - req._startTime,
      })
      res.send = originalSendFunc
      return originalSendFunc.apply(res, [body, ...args])
    }
    return next()
  }
}

// 全局异常处理
export function errorLogger() {
  return function (
    err: Error,
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) {
    let httpStatus = 500
    LOGGER.error('接口访问异常!', err)

    /** 业务异常 */
    if (err instanceof BizError) {
      httpStatus = 400
    } else {
      /** 非业务异常，包含交易异常和系统异常 */
      feishuNotifyInstance.error(err, request, response)
    }

    response.status(httpStatus).json({
      data: null,
      message: err.message,
      success: false,
      requestId: rTracer.id(),
    })
    next(err)
  }
}
