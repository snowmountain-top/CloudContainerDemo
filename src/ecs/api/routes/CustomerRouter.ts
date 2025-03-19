import { Router } from 'express'
import { transfer } from '../../middleware/router'

class CustomerRouter {
  expressRouter: Router
  constructor(processController: any) {
    this.expressRouter = Router()

    const funcNameList = Reflect.ownKeys(processController.constructor.prototype).filter(
      (item) => item !== 'constructor',
    )

    for (const funcName of funcNameList) {
      this.expressRouter.post(...transfer(processController[funcName], processController))
    }
  }

  get router() {
    return this.expressRouter
  }
}

export default CustomerRouter
