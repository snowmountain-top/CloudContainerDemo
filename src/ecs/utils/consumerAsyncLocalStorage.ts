import { AsyncLocalStorage } from 'async_hooks'

const asyncLocalStorage = new AsyncLocalStorage<{
  traceMessageId: string
}>()

class ConsumerAsyncLocalStorage {
  private asyncLocalStorage = asyncLocalStorage

  constructor() {}

  wrap(store: { traceMessageId: string }, fun: () => Promise<any>) {
    return this.asyncLocalStorage.run(store, async () => {
      return fun()
    })
  }

  initData(store: { traceMessageId: string }) {
    return store
  }

  get traceMessageId() {
    return this.asyncLocalStorage.getStore()?.traceMessageId
  }
}

const consumerAsyncLocalStorage = new ConsumerAsyncLocalStorage()
export default consumerAsyncLocalStorage
