import { MQConsumer } from '../MQConsumer'
import { ConsumeQueues, bindingConfig, PositiveHeaders, PositiveOrderPayload } from './config'
import getLogger from '../../utils/logger'

const LOGGER = getLogger()

abstract class QueueConsumer {
  protected queue: ConsumeQueues

  constructor(queue: ConsumeQueues) {
    this.queue = queue
    if (!this.queue) throw new Error('请配置队列名称')
  }

  // 启动消费者
  startConsumer() {
    const consumer = new MQConsumer(this.queue, bindingConfig)
    console.info(`消费者启动，queue：${this.queue}`)
    consumer.consume(
      async (payload: PositiveOrderPayload, header?: PositiveHeaders, routingKey?: any) => {
        await this.exec(payload, header, routingKey)
      },
    )
  }

  async exec(payload: PositiveOrderPayload, headers?: PositiveHeaders, routingKey?: any) {
    throw new Error('Method not implemented.')
  }
}

class PositiveOrderConsumer extends QueueConsumer {
  constructor() {
    super(ConsumeQueues.test)
  }

  async exec(payload: PositiveOrderPayload, headers?: PositiveHeaders, routingKey?: any) {
    LOGGER.info(`接到消息: ${routingKey}, ${JSON.stringify(payload)}`)
  }
}

const PosConsumerClassList = [PositiveOrderConsumer]
export default PosConsumerClassList
