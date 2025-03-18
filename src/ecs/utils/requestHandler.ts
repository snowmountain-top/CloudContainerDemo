import { Request as ExpressRequest } from 'express'

export class RequestHandler {
  getUserInfo(req: ExpressRequest) {
    const openId = req.headers['x-wx-openid'] as string
    const unionId = req.headers['x-wx-unionid'] as string
    const appId = req.headers['x-wx-appid'] as string
    return { appId, openId, unionId }
  }

  getClientIp(req: ExpressRequest) {
    const ip = req.headers['x-original-forwarded-for'] as string
    return ip
  }
}

const requestHandler = new RequestHandler()
export default requestHandler
