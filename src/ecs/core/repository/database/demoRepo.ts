import getBeLinkDataSource from '../../connection/database'
import Demo from '../../entity/Demo'

export class DemoRepo {
  async getById(id: string) {
    const dataSource = await getBeLinkDataSource()
    const demoRepo = dataSource.getRepository(Demo)
    const result = await demoRepo.findOne({ where: { id } })
    return result
  }
}

const demoRepo = new DemoRepo()
export default demoRepo
