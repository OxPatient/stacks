import process from 'node:process'
import { type CLI, type CleanOptions } from '@stacksjs/types'
import { runAction } from '@stacksjs/actions'
import { intro, outro } from '@stacksjs/cli'
import { Action, ExitCode } from '@stacksjs/types'

export async function clean(buddy: CLI) {
  const descriptions = {
    clean: 'Removes all node_modules & lock files',
    verbose: 'Enable verbose output',
  }

  buddy
    .command('clean', descriptions.clean)
    .option('--verbose', descriptions.verbose, { default: false })
    .action(async (options: CleanOptions) => {
      const perf = await intro('buddy clean')
      const result = await runAction(Action.Clean, { ...options, verbose: true })

      if (result.isErr()) {
        outro('While running the clean command, there was an issue', { startTime: perf, useSeconds: true, isError: true }, result.error as Error)
        process.exit(ExitCode.FatalError)
      }

      outro('Cleaned up', { startTime: perf, useSeconds: true })
      process.exit(ExitCode.Success)
    })
}
