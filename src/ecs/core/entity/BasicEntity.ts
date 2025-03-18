import { BaseEntity, BeforeInsert, BeforeUpdate, Column, PrimaryColumn } from 'typeorm'
import stringUtils from '@be-link/common-sdk/utils/string'

export default abstract class BasicEntity extends BaseEntity {
  @PrimaryColumn('varchar', {
    length: 32,
    nullable: false,
    default: '',
    comment: 'id',
  })
  id: string

  @Column('bigint', {
    unsigned: true,
    nullable: false,
    default: 0,
    comment: '创建时间',
  })
  createdAt: number

  @Column('bigint', {
    unsigned: true,
    nullable: false,
    default: 0,
    comment: '更新时间',
  })
  updatedAt: number

  @BeforeInsert()
  initData() {
    const current = new Date().getTime()
    this.createdAt = current
    this.updatedAt = current
    this.id = this.id || stringUtils.getObjectId()
  }

  @BeforeUpdate()
  updateTime() {
    this.updatedAt = new Date().getTime()
  }

  abstract dto(): Record<string, any>
}
