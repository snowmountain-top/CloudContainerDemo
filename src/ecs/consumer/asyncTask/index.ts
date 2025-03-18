import getLogger from '../../utils/logger'
import { createChannelWithTopic } from './connection/rabbitmq'
import { MQConsumer } from '../MQConsumer'
import asyncAction from '../../core/asyncAction/index'
import shieldConfigManager from '../../config/shieldConfigManager'

class QueueConsumer {
  protected queue: string

  // 启动消费者
  startConsumer() {
    this.queue = shieldConfigManager.config.ASYNC_TASK.QUEUE

    const consumer = new MQConsumer(
      this.queue,
      { vhost: shieldConfigManager.config.RABBITMQ.VHOST },
      createChannelWithTopic,
    )
    console.info(`消费者启动，queue：${this.queue}`)
    consumer.consume(async (payload: any, header?: any) => {
      await this.exec(payload, header)
    })
  }

  async exec(payload: any, header?: any) {
    throw new Error('Method not implemented.')
  }
}

class AsyncTaskConsumeFunction extends QueueConsumer {
  private consumeSwitch = true

  exec(payload: any, header?: any): Promise<void> {
    const method = payload.method
    const params = payload.params
    return asyncAction[method](...params, { consumeSwitch: this.consumeSwitch })
  }
}

const AsyncActionConsumerClassList = [AsyncTaskConsumeFunction]
export default AsyncActionConsumerClassList
