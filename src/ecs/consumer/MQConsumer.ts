import { ConfirmChannel, Message } from 'amqplib'
import { createChannelWithTopic } from './connection/rabbitmq'
import getLogger from '../utils/logger'
import feishuNotifyInstance, { FeishuGroup } from '../utils/feishuNotify'
import envUtils from '../utils/env'
import consumerAsyncLocalStorage from '../utils/consumerAsyncLocalStorage'
import { ConsumerConfig } from './type'
import shieldConfigManager from '../config/shieldConfigManager'

const LOGGER = getLogger()
export class MQConsumer {
  private queue: string
  // 降配后的队列
  private channelWrapper: any
  private retryQueue: string
  private retryExchange: string

  constructor(
    queue: string,
    bindingConfig: ConsumerConfig.BindingConfig,
    createChannelFunction = createChannelWithTopic,
  ) {
    this.queue = queue
    this.retryQueue = queue + '-retry'
    this.retryExchange = queue + '-retry'
    this.channelWrapper = createChannelFunction(
      queue,
      {
        hostname: shieldConfigManager.config.RABBITMQ.HOST,
        port: Number(shieldConfigManager.config.RABBITMQ.PORT),
        username: shieldConfigManager.config.RABBITMQ.USERNAME,
        password: shieldConfigManager.config.RABBITMQ.PASSWORD,
        vhost: bindingConfig.vhost,
      },
      bindingConfig,
    )
  }

  public async consume(callback: Function) {
    const ttl = envUtils.isProduction() ? 60000 : 6000

    // 降配后的队列
    this.channelWrapper.addSetup((channel: ConfirmChannel) => {
      return Promise.all([
        // 声明原始队列
        channel.assertQueue(this.queue, { durable: true }),
        // 声明重试交换机
        channel.assertExchange(this.retryExchange, 'direct', { durable: true }),
        // 将原始队列绑定到重试交换机
        channel.bindQueue(this.queue, this.retryExchange, this.queue),
        // 声明重试队列，当消息消费失败时，将消息投递到重试队列。重试队列的消息过期后，再通过重试交换机投递到原始队列

        channel.assertQueue(this.retryQueue, {
          durable: true,
          messageTtl: ttl,
          deadLetterExchange: this.retryExchange,
          deadLetterRoutingKey: this.queue,
        }),
        channel.prefetch(1),
        channel.consume(this.queue, async (message: Message) => {
          const payload = JSON.parse(JSON.parse(message.content.toString()))
          const headers = message.properties.headers
          const routingKey = message.fields.routingKey
          const retryCount = headers.retryCount || 1
          const traceMessageId = message.properties.messageId
          LOGGER.info({
            message: `接受到消息, queue: ${this.queue}, retryCount: ${retryCount}`,
            payload,
            routingKey: message.fields.routingKey,
            exchange: message.fields.exchange,
            traceMessageId,
          })
          try {
            const result = await consumerAsyncLocalStorage.wrap(
              { traceMessageId },
              callback.bind(null, payload, headers, routingKey),
            )
            LOGGER.info({
              message: `消息消费成功, queue: ${this.queue}`,
              result,
              traceMessageId,
            })
          } catch (err) {
            const serializedError = {
              message: err.message,
              stack: err.stack,
            }

            LOGGER.error({
              message: `消息消费失败, queue: ${this.queue}`,
              traceMessageId,
              error: serializedError,
            })

            const errmsg = `【消费消息失败】 \n【队列】:${
              this.queue
            } \n【消息】:${message.content.toString()}} \n【异常】:${JSON.stringify(
              serializedError,
            )}`

            if (retryCount <= 3) {
              message.properties.headers.retryCount = retryCount + 1
              message.properties.headers.originalRoutingKey =
                message.properties.headers?.originalRoutingKey || routingKey
              // message.properties.headers['x-delay'] = 2000
              channel.sendToQueue(this.retryQueue, message.content, {
                persistent: true,
                headers: message.properties.headers,
                messageId: traceMessageId,
              })
              LOGGER.info({
                message: `消息投递到重试队列, queue: ${this.retryQueue}, retryCount: ${retryCount}`,
                traceMessageId,
              })
            } else {
              feishuNotifyInstance.manualNotify(errmsg, FeishuGroup.ASYNC_TASK)
            }
          }
          channel.ack(message)
        }),
      ])
    })
  }
}
