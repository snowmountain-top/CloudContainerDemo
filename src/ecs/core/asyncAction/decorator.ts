import { isObject } from 'lodash'
import shieldConfigManager from '../../config/shieldConfigManager'
import feishuNotifyInstance, { FeishuGroup } from '../../utils/feishuNotify'
import getLogger from '../../utils/logger'
import { MQProducer } from '../connection/mqProducer'
const LOGGER = getLogger()

let asyncProducer: MQProducer = null

export function AsyncClass() {
  return function (constructor: Function) {
    // 获取类的原型对象
    const prototype = constructor.prototype

    // 遍历原型对象的所有属性
    Object.getOwnPropertyNames(prototype).forEach((propertyName) => {
      // 如果属性是函数（但不是构造函数），则应用装饰器逻辑
      if (propertyName !== 'constructor' && typeof prototype[propertyName] === 'function') {
        const originalMethod = prototype[propertyName]
        prototype[propertyName] = async function (...args: any[]) {
          if (!asyncProducer)
            asyncProducer = new MQProducer(shieldConfigManager.config.ASYNC_TASK.TOPIC, 'direct')

          // 消费者消费时，最后一个参数是一个对象，用来标识是否消费场景
          const lastParam = args[args.length - 1]
          // @ts-ignore
          if (isObject(lastParam) && lastParam.consumeSwitch)
            return originalMethod.apply(this, args)

          try {
            const content = { params: args, method: originalMethod.name }
            await asyncProducer.publish(content, shieldConfigManager.config.ASYNC_TASK.ROUTING_KEY)
            LOGGER.info(`异步任务投递成功: ${JSON.stringify(content)}`)
          } catch (e) {
            const err = { message: e.message, stack: e.stack }
            const errMsg = `异步任务投递失败: ${JSON.stringify(err)}`
            LOGGER.error(errMsg)
            feishuNotifyInstance.manualNotify(errMsg, FeishuGroup.ASYNC_TASK)
          }
        }
      }
    })
  }
}
