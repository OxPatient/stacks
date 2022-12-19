import { runCommand } from '@stacksjs/cli'
import { projectPath } from '@stacksjs/path'
import { NpmScript } from '@stacksjs/types'

await runCommand(NpmScript.LintFix, { debug: true, cwd: projectPath() })
