/** 系统环境变量 */

import { ConsumerConfig } from '../type'

export enum RoutingKeys {
  test = 'test',
}

export interface PositiveHeaders {
  categoryOne: string
  categoryTwo: string
}

export enum ConsumeQueues {
  test = 'test',
}

export interface PositiveOrderPayload {
  orderId: string
  eventTime: number
  operator: string
  operatorRole: string
  fromStatus: string
  toStatus: string
  unionId: string
}

export interface PositiveOrderReschedulePayload {
  orderId: string
  unionId: string
  eventTime: number
}

export const bindingConfig: ConsumerConfig.BindingConfig = {
  vhost: 'test',
  previousExchange: 'test-topic',
  sourceExchange: 'test-topic',
  bindingMap: {
    [RoutingKeys.test]: [ConsumeQueues.test],
  },
}
