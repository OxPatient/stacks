#!/usr/bin/env node

/**
 * This action copies all the generated types.
 */

import { copyFolder, frameworkPath } from '@stacksjs/utils'

// relative to scripts directory
const destinations = [
  [frameworkPath('dist/types/components'), frameworkPath('vue-components/dist/types')],
  [frameworkPath('dist/types/components'), frameworkPath('web-components/dist/types')],
  [frameworkPath('dist/types/functions'), frameworkPath('functions/dist/types')],
]

destinations.forEach(([src, dest]) => {
  // const srcPath = resolve(__filename, '..', src)
  // const destPath = resolve(__filename, '..', dest)

  copyFolder(src, dest)
})
