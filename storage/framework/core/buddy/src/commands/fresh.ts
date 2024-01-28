import process from 'node:process'
import { ExitCode } from '@stacksjs/types'
import type { CLI, FreshOptions } from '@stacksjs/types'
import { runAction } from '@stacksjs/actions'
import { intro, outro } from '@stacksjs/cli'
import { Action } from '@stacksjs/enums'

export function fresh(buddy: CLI) {
  const descriptions = {
    fresh: 'Reinstalls your npm dependencies',
    project: 'Target a specific project',
    verbose: 'Enable verbose output',
  }

  buddy
    .command('fresh', descriptions.fresh)
    .option('-p, --project', descriptions.project, { default: false })
    .option('--verbose', descriptions.verbose, { default: false })
    .action(async (options: FreshOptions) => {
      const perf = await intro('buddy fresh')
      const result = await runAction(Action.Fresh, { ...options, stdout: 'inherit' })

      if (result.isErr()) {
        await outro('While running `buddy fresh`, there was an issue', { startTime: perf, useSeconds: true }, result.error)
        process.exit(ExitCode.FatalError)
      }

      await outro('Freshly reinstalled your dependencies', { startTime: perf, useSeconds: true })
      process.exit(ExitCode.Success)
    })

  buddy.on('fresh:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', buddy.args.join(' '))
    process.exit(1)
  })
}