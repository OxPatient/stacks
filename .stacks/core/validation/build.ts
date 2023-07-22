import { log, runCommand } from '@stacksjs/cli'

const result = await runCommand('bun build ./src/index.ts --outdir dist --format esm --external @vinejs/vine --external @stacksjs/utils --external @stacksjs/vite --external @stacksjs/vite --external @stacksjs/cache --target bun', {
  cwd: import.meta.dir,
})

if (result.isErr())
  log.error(result.error)

else
  log.success('Build complete')
