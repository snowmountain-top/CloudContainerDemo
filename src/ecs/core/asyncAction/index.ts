import getLogger from '../../utils/logger'
import { AsyncClass } from './decorator'

const LOGGER = getLogger()

@AsyncClass()
class AsyncAction {
  async demoAsyncTask() {
    console.info('demoAsyncTask start')
  }
}

const asyncAction = new AsyncAction()
export default asyncAction
