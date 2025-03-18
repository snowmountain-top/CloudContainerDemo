export namespace ConsumerConfig {
  export interface MQConfig {
    hostname: string
    port: number
    username: string
    password: string
    vhost: string
  }

  export interface BindingConfig {
    vhost: string
    previousExchange?: string
    sourceExchange?: string
    bindingMap?: Record<string, string[]>
  }
}
