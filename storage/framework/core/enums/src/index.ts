/**
 * The available npm scripts within the Stacks toolkit.
 */
export enum NpmScript {
  Build = 'build',
  BuildComponents = 'vite build --config ./src/vite/src/components.ts',
  BuildWebComponents = 'build:web-components',
  BuildFunctions = 'build:functions',
  BuildDocs = 'build:docs',
  BuildStacks = 'build:stacks',
  Clean = 'rimraf bun.lockb node_modules/ stacks/**/dist',
  Dev = 'dev',
  DevApi = 'dev:api',
  DevDocs = 'dev:docs',
  DevDesktop = 'dev:desktop',
  DevFunctions = 'dev:functions',
  Fresh = 'fresh',
  Lint = 'eslint .',
  LintFix = 'eslint . --fix',
  LintPackageJson = 'bunx publint',
  MakeStack = 'make:stack',
  Test = 'bun test',
  TestUnit = 'bun test 2',
  TestFeature = 'playwright test --config playwright.config.ts',
  TestUi = 'bun test 3',
  TestCoverage = 'bun test 4',
  TestTypes = 'vue-tsx bun --bun tsc --noEmit',
  Generate = 'generate',
  GenerateTypes = 'generate:types',
  GenerateEntries = 'generate:entries',
  GenerateWebTypes = 'generate:web-types',
  GenerateVsCodeCustomData = 'generate:vscode-custom-data',
  GenerateIdeHelpers = 'generate:ide-helpers',
  GenerateComponentMeta = 'generate:component-meta',
  Release = 'release',
  Commit = 'commit',
  Example = 'example',
  ExampleVue = 'example:vue',
  ExampleWebComponents = 'example:web-components',
  KeyGenerate = 'key:generate',
  TypesFix = 'types:fix',
  TypesGenerate = 'types:generate',
  Preinstall = 'preinstall',
  Prepublish = 'prepublish',
  UpgradeBun = './storage/framework/core/scripts/setup.sh +bun.sh',
  UpgradeDependencies = 'pnpm up',
}

export enum Action {
  Bump = 'bump',
  BuildStacks = 'build/stacks',
  BuildComponentLibs = 'build/component-libs',
  BuildVueComponentLib = 'build-vue-component-lib',
  BuildWebComponentLib = 'build-web-component-lib',
  BuildCli = 'build-cli',
  BuildCore = 'build/core',
  BuildDesktop = 'build/desktop',
  BuildDocs = 'build-docs',
  BuildFunctionLib = 'build-function-lib',
  Changelog = 'changelog',
  Clean = 'clean',
  DevComponents = 'dev/components',
  DevDashboard = 'dev/dashboard',
  Dev = 'dev/views',
  DevApi = 'dev/api',
  DevDesktop = 'dev/desktop',
  DevDocs = 'dev/docs',
  Deploy = 'deploy/index',
  DomainsAdd = 'domains/add',
  DomainsPurchase = 'domains/purchase',
  DomainsRemove = 'domains/remove',
  Fresh = 'fresh',
  GenerateLibraryEntries = 'generate/lib-entries',
  Inspire = 'inspire',
  KeyGenerate = 'key-generate',
  MakeNotification = 'make-notification',
  Migrate = 'migrate',
  MigrateDns = 'migrate/dns',
  Seed = 'seed',
  Lint = 'lint/index',
  LintFix = 'lint/fix',
  Prepublish = 'prepublish',
  Release = 'release', // ✅
  ShowFeatureTestReport = 'show-feature-test-report',
  StartCaddy = 'start-caddy',
  Test = 'test',
  TestUi = 'test-ui',
  TestUnit = 'test-unit',
  TestFeature = 'test-feature',
  TestCoverage = 'test-coverage',
  Tinker = 'tinker',
  Typecheck = 'typecheck',
  Upgrade = 'upgrade/index',
  UpgradeBun = 'upgrade/bun',
}
