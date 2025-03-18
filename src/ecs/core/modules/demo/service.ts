import asyncAction from '../../asyncAction'

export class DemoService {
  async demoFunc(param: any): Promise<{}> {
    await asyncAction.demoAsyncTask()
    return {}
  }
}

const demoService = new DemoService()
export default demoService
