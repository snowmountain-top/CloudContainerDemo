import Demo from '../entity/Demo'

export default class BizDemo {
  private demoEntity: Demo

  constructor(demoEntity: Demo) {
    this.demoEntity = demoEntity
  }

  async demoFunction(): Promise<void> {}

  get id() {
    return this.demoEntity.id
  }
}
