import getLogger from './logger'
import { isEmpty } from 'lodash'

interface StatData {
  /** 主场景 */
  scene: string
  /** 子场景 */
  subScene?: string
  /** 打点值 */
  data: string | number | boolean
  /** 附加数据(不会加入索引) */
  extra?: { [key: string]: any }
}

/**
 * 业务打点辅助类
 * @class
 */
export class StatUtil {
  private readonly domain: string = 'ecs'
  private logger: ReturnType<typeof getLogger>

  constructor() {
    this.logger = getLogger()
  }

  /** 打点方法 */
  stat(param: StatData) {
    const { scene, subScene, data, extra } = param

    if (isEmpty(scene)) throw new Error('StatUtil: Argument "scene" is required')

    const log = {
      domain: this.domain,
      scene,
      subScene: subScene || '',
      data: String(data),
      ...extra,
    }

    this.logger.info(log)
  }
}

const statUtil = new StatUtil()
export default statUtil
