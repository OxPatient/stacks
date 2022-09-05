/**
 * The parsed command-line arguments
 */
export interface StacksOptions {
  componentsSrcPath?: string
  dtsPath?: string
  extensions?: string[]
}

export const enum NpmScript {
  Build = 'build',
  BuildComponents = 'build:components',
  BuildElements = 'build:elements',
  BuildFunctions = 'build:functions',
  BuildArtisanCli = 'build:artisan-cli',
  Dev = 'dev',
  DevComponents = 'dev:components',
  DevFunctions = 'dev:functions',
  Fresh = 'fresh',
  Update = 'update',
  Lint = 'lint',
  LintFix = 'lint:fix',
}
