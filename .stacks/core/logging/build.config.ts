import { defineBuildConfig } from 'unbuild'
import { alias } from '@stacksjs/alias'

export default defineBuildConfig({
  alias,

  entries: [
    './src/index',
  ],

  // externals: [
  //   '@stacksjs/development',
  //   '@stacksjs/alias',
  //   'consola',
  //   'vue-ray',
  //   'node-ray',
  // ],

  rollup: {
    alias,
    inlineDependencies: true,
  },

  declaration: true,
  clean: true,
})
