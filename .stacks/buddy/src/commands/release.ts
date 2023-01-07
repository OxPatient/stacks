import type { CLI, ReleaseOptions } from '@stacksjs/types'
import { intro, log, outro } from '@stacksjs/cli'
import { runAction } from '@stacksjs/actions'
import { Action } from '@stacksjs/types'

const descriptions = {
  release: 'Release a new version of your libraries/packages',
  debug: 'Enable debug mode',
}

async function release(buddy: CLI) {
  buddy
    .command('release', descriptions.release)
    .option('--debug', descriptions.debug, { default: true }) // it's on by default because it requires manual input
    .action(async (options: ReleaseOptions) => {
      const startTime = await intro('buddy release')
      const result = await runAction(Action.Release, options)

      if (result.isErr()) {
        log.error('Failed to trigger the CI/CD release workflow.', result.error)
        process.exit()
      }

      outro('Triggered CI/CD release workflow', { startTime, useSeconds: true })
    })
}

export { release }
