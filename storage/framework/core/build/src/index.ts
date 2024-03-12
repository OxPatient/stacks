import process from 'node:process'
import { path as p } from '@stacksjs/path'
import { fs, glob } from '@stacksjs/storage'
import { bold, dim, log } from '@stacksjs/cli'

export {
  vueComponentExample,
  webComponentExample,
  functions,
  views,
  vueComponents,
  webComponents,
  stacks,
} from '@stacksjs/vite'

// export { build } from 'bun'

export async function outro(options: {
  dir: string
  startTime: number
  result: any
}) {
  const endTime = Date.now()
  const timeTaken = endTime - options.startTime
  const pkgName = `@stacksjs/${p.basename(options.dir)}`

  if (!options.result.success) {
    // eslint-disable-next-line no-console
    console.log(options.result.logs[0])
    process.exit(1)
  }

  // loop over all the files in the dist directory and log them and their size
  const files = await glob(p.resolve(options.dir, 'dist', '*'))
  for (const file of files) {
    const stats = await fs.stat(file)

    let sizeStr
    if (stats.size < 1024 * 1024) {
      const sizeInKb = stats.size / 1024
      sizeStr = `${sizeInKb.toFixed(2)}kb`
    }
    else {
      const sizeInMb = stats.size / 1024 / 1024
      sizeStr = `${sizeInMb.toFixed(2)}mb`
    }

    const relativeFilePath = p.relative(options.dir, file).replace('dist/', '')
    // eslint-disable-next-line no-console
    console.log(`${bold(dim(`[${sizeStr}]`))} ${dim('dist/')}${relativeFilePath}`)
  }

  log.success(`${bold(dim(`[${timeTaken}ms]`))} Built ${pkgName}`)
}
