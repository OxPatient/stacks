import { defineBuildConfig } from 'unbuild'
import { alias } from '@stacksjs/alias'

export default defineBuildConfig({
  alias,
  entries: [
    'src/user/index',
    'src/index',
  ],
  declaration: true,
  clean: true,
  externals: [
    'fast-glob',
    'fsevents',
    'sass',
    'unbuild',
    'unplugin-auto-import',
    'unplugin-vue-components',
    'vite-ssg',
    'vite',
    'execa',
    'ora',
    'neverthrow',
    '@mdit-vue/plugin-component',
    'cac',
    'vite-plugin-vue-layouts',
    'vite-plugin-inspect',
    'vitepress',
    'zod',
    '@rollup/pluginutils',
    '@types/markdown-it-link-attributes',
    'vue',
    'markdown-it',
    'markdown-it-shiki',
    '@mdit-vue/types',
    '@mdit-vue/plugin-frontmatter',
    'meilisearch',
    'unocss',
    'vite-plugin-pwa',
    '@novu/stateless',
  ],
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
})
