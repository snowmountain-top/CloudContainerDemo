import statUtil from '../utils/stat'

/** 业务打点方法统一收口在这，statUtil不包含业务逻辑，只是作为基础能力向上暴露 */
class BizStat {
  statDemo(data: string, version: string) {
    statUtil.stat({
      scene: 'demo',
      subScene: 'demoSubScene',
      data,
      extra: {
        version,
      },
    })
  }
}

const bizStat = new BizStat()
export default bizStat
