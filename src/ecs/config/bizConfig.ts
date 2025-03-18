import { configInstance } from './remoteConfig'

class BizConfig {
  get demoConfig() {
    return {
      title: 'Demo',
      description: 'This is a demo',
    }
  }
}

const bizConfig = new BizConfig()
export default bizConfig
