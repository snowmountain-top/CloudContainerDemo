/**
 * 该类型异常不会触发飞书告警通知, 但会正常向上抛出
 * 适用于业务可容忍但需要阻断流程的场景
 */
export default class BizError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BizError'
  }
}
