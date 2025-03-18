import processController from '../controller/demo'
import CustomerRouter from './CustomerRouter'

const demoControllerRouter = new CustomerRouter(processController).router
export default demoControllerRouter
