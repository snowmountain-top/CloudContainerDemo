import BasicEntity from './BasicEntity'
import { Column, Entity } from 'typeorm'

@Entity({ name: 'DemoTable' })
export default class Demo extends BasicEntity {
  @Column('varchar', {
    length: 32,
    nullable: false,
    default: '',
    comment: 'demoId',
  })
  demo: string

  dto() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
