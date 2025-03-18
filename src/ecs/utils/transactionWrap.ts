import { EntityManager } from 'typeorm'
import getDataSource from '../core/connection/database'

export async function transactionWrap<T>(fn: (entity: EntityManager) => T): Promise<T> {
  const dataSource = await getDataSource()
  return dataSource.transaction(async (manager) => {
    const res = await fn(manager)
    return res
  })
}
