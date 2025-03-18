import amqp from 'amqp-connection-manager'
import { ConfirmChannel } from 'amqplib'

import shieldConfigManager from '../../../config/shieldConfigManager'

export type TopicType = 'direct' | 'fanout' | 'topic' | 'headers'

export function createChannelWithTopic(
  queue: string,
  config: {
    hostname: string
    port: number
    username: string
    password: string
    vhost: string
  },
) {
  const connection = amqp.connect([config])
  connection.on('connect', function () {
    console.info('[AmqpConnectionManager]连接成功')
  })
  connection.on('disconnect', function (err) {
    console.info('[AmqpConnectionManager]断开连接%O', err)
  })
  connection.on('connectFailed', function (err) {
    console.info('[AmqpConnectionManager]连接失败%O', err)
  })

  const channelWrapper = connection.createChannel({
    json: true,
    setup: (channel: ConfirmChannel) => {
      return Promise.all([
        channel.assertExchange(shieldConfigManager.config.ASYNC_TASK.TOPIC, 'direct', {
          durable: true,
        }),
        channel.assertQueue(shieldConfigManager.config.ASYNC_TASK.QUEUE, { durable: true }),
        channel.bindQueue(
          shieldConfigManager.config.ASYNC_TASK.QUEUE,
          shieldConfigManager.config.ASYNC_TASK.TOPIC,
          shieldConfigManager.config.ASYNC_TASK.ROUTING_KEY,
        ),
      ])
    },
  })
  return channelWrapper
}
