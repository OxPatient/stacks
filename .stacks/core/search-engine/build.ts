import { log, runCommand } from '@stacksjs/cli'

const result = runCommand('bun build ./src/index.ts --outdir dist --format esm --external @stacksjs/config --external @stacksjs/ui --external @stacksjs/utils --external @stacksjs/logging --external @stacksjs/validation --external meilisearch --external bun --target bun', {
  cwd: import.meta.dir,
})

if (result.isErr())
  log.error(result.error)