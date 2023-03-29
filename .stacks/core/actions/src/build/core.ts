import { frameworkPath } from '@stacksjs/path'
import { runCommands } from '@stacksjs/cli'

await runCommands([
  'pnpm --filter ./core/** --filter=!./config --filter=!./core/x-ray --filter=!./core/buddy build', // command to build the core packages, excluding the config & x-ray package
  'pnpm --filter ./config build', // command to build the config package
], { verbose: true, cwd: frameworkPath(), shell: true })
