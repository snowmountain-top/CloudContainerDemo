import { Request as ExpressRequest } from 'express'

export interface InjectUserInfo {
  userInfo: {
    appId: string
    openId: string
    unionId: string
  }
}
export type CustomerRequest = ExpressRequest & InjectUserInfo

/** 收口sdk中 */
export namespace Enum {}

export namespace Controller {
  export namespace DemoController {
    export namespace Request {
      export interface demoFunc {}
    }
    export namespace Response {
      export interface demoFunc {}
    }
    export interface Main {
      demoFunc(param: Request.demoFunc, req: CustomerRequest): Promise<Response.demoFunc>
    }
  }
}
