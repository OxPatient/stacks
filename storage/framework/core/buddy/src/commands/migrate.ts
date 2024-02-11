import process from 'node:process'
import { ExitCode } from '@stacksjs/types'
import type { CLI, MigrateOptions } from '@stacksjs/types'
import { runAction } from '@stacksjs/actions'
import { intro, log, outro } from '@stacksjs/cli'
import { Action } from '@stacksjs/enums'

export function migrate(buddy: CLI) {
  const descriptions = {
    migrate: 'Migrates your database',
    dns: 'Writes the DNS records for a domain to ./config/dns.ts',
    project: 'Target a specific project',
    verbose: 'Enable verbose output',
  }

  buddy
    .command('migrate', descriptions.migrate)
    .option('-p, --project', descriptions.project, { default: false })
    .option('--verbose', descriptions.verbose, { default: false })
    .action(async (options: MigrateOptions) => {
      log.debug('Running `buddy migrate` ...', options)

      const perf = await intro('buddy migrate')
      const result = await runAction(Action.Migrate, { ...options })

      if (result.isErr()) {
        await outro('While running the migrate command, there was an issue', { startTime: perf, useSeconds: true }, result.error)
        process.exit()
      }

      const APP_ENV = process.env.APP_ENV || 'local'

      await outro(`Migrated your ${APP_ENV} database.`, { startTime: perf, useSeconds: true })
      process.exit(ExitCode.Success)
    })

  buddy
    .command('migrate:dns', descriptions.migrate)
    .option('-p, --project', descriptions.project, { default: false })
    .option('--verbose', descriptions.verbose, { default: false })
    .action(async (options: MigrateOptions) => {
      log.debug('Running `buddy migrate:dns` ...', options)

      const perf = await intro('buddy migrate:dns')
      const result = await runAction(Action.MigrateDns, { ...options })

      if (result.isErr()) {
        await outro('While running the migrate:dns command, there was an issue', { startTime: perf, useSeconds: true }, result.error)
        process.exit()
      }

      const APP_URL = process.env.APP_URL || 'undefined'

      await outro(`Migrated your ${APP_URL} DNS.`, { startTime: perf, useSeconds: true })
      process.exit(ExitCode.Success)
    })

  buddy.on('migrate:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', buddy.args.join(' '))
    process.exit(1)
  })
}
