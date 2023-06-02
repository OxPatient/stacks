import type {
  AppOptions,
  CacheOptions,
  CdnOptions,
  CronJobOptions,
  DatabaseOptions,
  DebugOptions,
  DnsOptions,
  EmailOptions,
  Events,
  GitOptions,
  HashingOptions,
  LibraryOptions,
  Model,
  NotificationOptions,
  PagesOption,
  PaymentOptions,
  SearchEngineOptions,
  ServicesOptions,
  StacksOptions,
  StorageOptions,
  UiOptions,
  UserCliOptions,
} from '@stacksjs/types'
import { stacksConfigDefaults } from '@stacksjs/config'

type Config = StacksOptions

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends ArrayLike<any>
      ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never

type Path<T> = PathImpl<T, keyof T> | keyof T

type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never

// @ts-expect-error - unsure how to best type this
function config<P extends Path<Config>>(path: P, fallback?: PathValue<Config, P>): PathValue<Config, P> | undefined {
  const keys = path.split('.') as string[]
  let result: any = stacksConfigDefaults

  for (const k of keys) {
    if (result[k] === undefined)
      return fallback

    result = result[k]
  }

  return result
}

// const url = config('app.url') // url is typed as string
// const debug = config('app.debug') // debug is typed as boolean
const driver = config('database.drivers.mysql.port', 5432) // port is typed as number

export function env<T>(key: string, _fallback?: T): T | string | undefined {
  if (key && import.meta?.env) {
    const envValue = import.meta.env[key]
    if (envValue !== undefined)
      return envValue as any
  }
  return _fallback
}

export function defineApp(options: Partial<AppOptions>) {
  return options
}

export function defineCache(options: Partial<CacheOptions>) {
  return options
}

export function defineCdn(options: Partial<CdnOptions>) {
  return options
}

export function defineCli(options: Partial<UserCliOptions>) {
  return options
}

export function defineCronJobsConfig(options: Partial<CronJobOptions>[]) {
  return options
}

export function defineDatabase(options: Partial<DatabaseOptions>) {
  return options
}

export function defineDebugConfig(options: Partial<DebugOptions>) {
  return options
}

// export function defineCloudConfig(options: Partial<CloudOptions>) {
//   return options
// }

export function defineDns(options: Partial<DnsOptions>) {
  return options
}

export function defineEmailConfig(options: Partial<EmailOptions>) {
  return options
}

export function defineEvents(options: Partial<Events>) {
  return options
}

export function defineGit(options: Partial<GitOptions>) {
  return options
}

export function defineHashing(options: Partial<HashingOptions>) {
  return options
}

export function defineLibrary(options: Partial<LibraryOptions>) {
  return options
}

export function defineModel(options: Partial<Model>) {
  return options
}

export function defineNotification(options: Partial<NotificationOptions>) {
  return options
}

export function definePage(options: Partial<PagesOption>) {
  return options
}

export function definePayment(options: Partial<PaymentOptions>) {
  return options
}

export function defineSearchEngine(options: Partial<SearchEngineOptions>) {
  return options
}

export function defineServices(options: Partial<ServicesOptions>) {
  return options
}

export function defineStorage(options: Partial<StorageOptions>) {
  return options
}

export function defineUi(options: Partial<UiOptions>) {
  return options
}
