import express from 'express'
import requestHandler from '../utils/requestHandler'
import { CustomerRequest } from '../types'

// 全局异常处理
export function injectUserInfo() {
  return function (
    request: CustomerRequest,
    response: express.Response,
    next: express.NextFunction,
  ) {
    const userInfo = requestHandler.getUserInfo(request)
    request.userInfo = userInfo
    next()
  }
}
