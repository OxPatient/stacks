import process from 'node:process'
import { type CLI, type FreshOptions } from '@stacksjs/types'
import { runAction } from '@stacksjs/actions'
import { intro, outro } from '@stacksjs/cli'
import { Action, ExitCode } from '@stacksjs/types'

export async function fresh(buddy: CLI) {
  const descriptions = {
    fresh: 'Reinstalls your npm dependencies',
    verbose: 'Enable verbose output',
  }

  buddy
    .command('fresh', descriptions.fresh)
    .option('--verbose', descriptions.verbose, { default: false })
    .action(async (options: FreshOptions) => {
      const perf = await intro('buddy fresh')
      const result = await runAction(Action.Fresh, { ...options, verbose: true })

      if (result.isErr()) {
        outro('While running the `fresh` command, there was an issue', { startTime: perf, useSeconds: true, isError: true }, result.error as Error)
        process.exit(ExitCode.FatalError)
      }

      outro('Freshly reinstalled your dependencies', { startTime: perf, useSeconds: true })
      process.exit(ExitCode.Success)
    })
}
