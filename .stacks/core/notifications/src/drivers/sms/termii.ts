import { TermiiSmsProvider } from '@novu/termii'
import { italic } from '@stacksjs/cli'
import type { SmsOptions } from '@stacksjs/types'
import { ResultAsync } from '@stacksjs/error-handling'
import { notification } from '@stacksjs/config'

const env = notification.sms.termii

const provider = new TermiiSmsProvider({
  apiKey: env.key,
  from: env.from,
})

function send(options: SmsOptions) {
  return ResultAsync.fromPromise(
    provider.sendMessage(options),
    () => new Error(`Failed to send message using provider: ${italic('Termii')}`),
  )
}

export { send as Send, send }
