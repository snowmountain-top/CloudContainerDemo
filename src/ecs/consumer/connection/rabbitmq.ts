import amqp from 'amqp-connection-manager'
import { ConfirmChannel } from 'amqplib'
import { ConsumerConfig } from '../type'

export type TopicType = 'direct' | 'fanout' | 'topic' | 'headers'

export function createChannelWithTopic(
  queue: string,
  config: ConsumerConfig.MQConfig,
  bindingConfig: ConsumerConfig.BindingConfig,
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
      const matchRoutingKeys = []
      for (const [routingKey, bindingRelation] of Object.entries(bindingConfig.bindingMap)) {
        if (!bindingRelation.includes(queue)) continue
        matchRoutingKeys.push(routingKey)
      }
      return Promise.all([
        // 断言交换机
        channel.assertExchange(bindingConfig.sourceExchange, 'topic', { durable: true }),
        // 绑定交换机(可选)
        (async function () {
          if (bindingConfig.previousExchange) {
            return Object.keys(bindingConfig.bindingMap).map((routingKey) =>
              channel.bindExchange(
                bindingConfig.sourceExchange,
                bindingConfig.previousExchange,
                routingKey,
              ),
            )
          } else {
            return null
          }
        })(),
        // 断言队列
        channel.assertQueue(queue, { durable: true }),
        // 绑定队列
        matchRoutingKeys.map((routingKey) =>
          channel.bindQueue(queue, bindingConfig.sourceExchange, routingKey),
        ),
      ])
    },
  })
  return channelWrapper
}
