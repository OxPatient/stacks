import { log } from '@stacksjs/cli'
import { db } from '@stacksjs/database'
import { getModelName, getTableName } from '@stacksjs/orm'
import { path } from '@stacksjs/path'
import { fs, glob } from '@stacksjs/storage'
import { plural, singular, snakeCase } from '@stacksjs/strings'
import type { Attributes, Model, RelationConfig, VineType } from '@stacksjs/types'
import { isString } from '@stacksjs/validation'

export * from './mysql'
export * from './postgres'
export * from './sqlite'

interface Range {
  min: number
  max: number
}

export async function getLastMigrationFields(modelName: string): Promise<Attributes> {
  const oldModelPath = path.frameworkPath(`database/models/${modelName}`)
  const model = (await import(oldModelPath)).default as Model
  let fields = {} as Attributes

  if (typeof model.attributes === 'object') fields = model.attributes
  else fields = JSON.parse(model.attributes) as Attributes

  return fields
}

export async function modelTableName(model: Model | string): Promise<string> {
  if (typeof model === 'string') {
    model = (await import(model)).default as Model
  }

  return model.table ?? snakeCase(plural(model?.name || ''))
}

export async function hasTableBeenMigrated(tableName: string) {
  log.debug(`hasTableBeenMigrated for table: ${tableName}`)

  const results = await getExecutedMigrations()

  return results.some((migration) => migration.name.includes(tableName))
}

export async function getExecutedMigrations() {
  try {
    return await db.selectFrom('migrations').select('name').execute()
  } catch (error) {
    return []
  }
}

function hasFunction(rule: VineType, functionName: string): boolean {
  return typeof rule[functionName] === 'function'
}

export function mapFieldTypeToColumnType(rule: VineType): string {
  if (hasFunction(rule, 'getChoices')) {
    // Condition checker if an attribute is enum, could not think any conditions atm
    const enumChoices = rule.getChoices() as string[]

    // Convert each string value to its corresponding string structure
    const enumStructure = enumChoices.map((value) => `'${value}'`).join(', ')

    // Construct the ENUM definition
    const enumDefinition = `sql\`enum(${enumStructure})\``

    return enumDefinition
  }

  if (rule[Symbol.for('schema_name')].includes('string'))
    // Default column type for strings
    return prepareTextColumnType(rule)

  if (rule[Symbol.for('schema_name')].includes('number')) return `'integer'`

  if (rule[Symbol.for('schema_name')].includes('boolean')) return `'boolean'`

  if (rule[Symbol.for('schema_name')].includes('date')) return `'date'`

  // need to now handle all other types

  // Add cases for other types as needed, similar to the original function
  switch (rule) {
    case 'integer':
      return `'int'`
    case 'boolean':
      return `'boolean'`
    case 'date':
      return `'date'`
    case 'datetime':
      return `'timestamp'`
    case 'float':
      return `'float'`
    case 'decimal':
      return `'decimal'`
    default:
      return `'text'` // Fallback for unknown types
  }
}

export function prepareTextColumnType(rule: VineType) {
  let columnType = 'varchar(255)'

  // Find min and max length validations
  const minLengthValidation = rule.validations.find((v: any) => v.options?.min !== undefined)
  const maxLengthValidation = rule.validations.find((v: any) => v.options?.max !== undefined)

  // If there's a max length validation, adjust the column type accordingly
  if (maxLengthValidation) {
    const maxLength = maxLengthValidation.options.max

    columnType = `varchar(${maxLength})`
  }

  // If there's only a min length validation and no max, consider using text
  // This is a simplistic approach; adjust based on your actual requirements
  if (minLengthValidation && !maxLengthValidation) columnType = 'text'

  return `'${columnType}'`
}

export function findCharacterLength(rule: VineType): { min: number; max: number } | undefined {
  const result: any = {}

  // Find min and max length validations
  const minLengthValidation = rule.validations.find((v: any) => v.options?.min !== undefined)
  const maxLengthValidation = rule.validations.find((v: any) => v.options?.max !== undefined)

  if (minLengthValidation === undefined || maxLengthValidation === undefined) {
    return undefined
  }

  for (const key of ['min', 'max']) {
    if (maxLengthValidation.options[key] === undefined && minLengthValidation.options[key] === undefined) continue

    result.max = maxLengthValidation.options[key]
    result.min = minLengthValidation.options[key]
  }

  // if (minLengthValidation.options[key] !== maxLengthValidation.options[key]) {
  //   result[key] = maxLengthValidation.options[key];
  // }
  return result
}

export function compareRanges(range1: Range, range2: Range): boolean {
  return range1.min === range2.min && range1.max === range2.max
}

export async function checkPivotMigration(dynamicPart: string): Promise<boolean> {
  const files = await fs.readdir(path.userMigrationsPath())

  return files.some((migrationFile) => {
    // Escape special characters in the dynamic part to ensure it's treated as a literal string
    const escapedDynamicPart = dynamicPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Construct the regular expression pattern dynamically
    const pattern = new RegExp(`(-${escapedDynamicPart}-)`)

    // Test if the input string matches the pattern
    return pattern.test(migrationFile)
  })
}

export async function getRelations(model: Model, modelPath: string): Promise<RelationConfig[]> {
  const relationsArray = ['hasOne', 'hasMany', 'belongsToMany', 'hasOneThrough']
  const relationships = []

  for (const relation of relationsArray) {
    if (hasRelations(model, relation)) {
      for (const relationInstance of model[relation]) {
        let relationModel = relationInstance.model

        if (isString(relationInstance)) {
          relationModel = relationInstance
        }

        const modelRelationPath = path.userModelsPath(relationModel)
        const modelRelation = (await import(modelRelationPath)).default
        const modelName = getModelName(model, modelPath)
        const formattedModelName = modelName.toLowerCase()
        const tableName = getTableName(model, modelPath)
        const modelRelationTable = getModelName(modelRelation, modelRelationPath)

        relationships.push({
          relationship: relation,
          model: relationModel,
          table: modelRelationTable,
          relationModel: modelName,
          relationTable: tableName,
          foreignKey: relationInstance.foreignKey || `${formattedModelName}_id`,
          relationName: relationInstance.relationName || '',
          throughModel: relationInstance.through || '',
          throughForeignKey: relationInstance.throughForeignKey || '',
          pivotTable: relationInstance?.pivotTable || getPivotTableName(formattedModelName, modelRelationTable),
        })
      }
    }
  }

  return relationships
}

export async function fetchOtherModelRelations(model: Model, modelPath: string): Promise<RelationConfig[]> {
  const modelFiles = glob.sync(path.userModelsPath('*.ts'))
  const modelRelations = []

  for (let i = 0; i < modelFiles.length; i++) {
    const modelFileElement = modelFiles[i] as string
    const modelFile = (await import(modelFileElement)).default as Model
    const tableName = getTableName(model, modelPath)
    const modelName = getModelName(model, modelPath)
    const modelFileName = getTableName(modelFile, modelFileElement)

    if (tableName === modelFileName) continue

    const relations = await getRelations(modelFile, modelFileElement)

    if (!relations.length) continue

    const relation = relations.find((relation) => relation.model === modelName)

    if (relation) modelRelations.push(relation)
  }

  return modelRelations
}

export async function getPivotTables(
  model: Model,
  modelPath: string,
): Promise<{ table: string; firstForeignKey: string | undefined; secondForeignKey: string | undefined }[]> {
  const pivotTable = []

  const tableName = getTableName(model, modelPath)

  let firstForeignKey = ''
  let secondForeignKey = ''
  let table = ''
  let modelRelationPath = ''

  if (model.belongsToMany) {
    if ('belongsToMany' in model) {
      for (const belongsToManyRelation of model.belongsToMany) {
        if (typeof belongsToManyRelation === 'string') {
          modelRelationPath = path.userModelsPath(`${belongsToManyRelation}.ts`)
        } else {
          modelRelationPath = path.userModelsPath(`${belongsToManyRelation.model}.ts`)
        }

        const modelRelation = (await import(modelRelationPath)).default
        const formattedTableName = tableName.toLowerCase()

        const modelRelationTable = getTableName(modelRelation, modelRelationPath)
        // const modelRelationModelName = getModelName(modelRelation, modelRelationPath)

        if (typeof belongsToManyRelation === 'string') {
          firstForeignKey = `${singular(tableName.toLowerCase())}_${model.primaryKey}`
          secondForeignKey = `${singular(modelRelationTable)}_${model.primaryKey}`
          table = getPivotTableName(formattedTableName, modelRelationTable)
        } else {
          firstForeignKey =
            belongsToManyRelation.firstForeignKey || `${singular(tableName.toLowerCase())}_${model.primaryKey}`
          secondForeignKey =
            belongsToManyRelation.secondForeignKey || `${singular(modelRelationTable)}_${model.primaryKey}`
          table = belongsToManyRelation?.pivotTable || getPivotTableName(formattedTableName, modelRelationTable)
        }

        pivotTable.push({
          table,
          firstForeignKey,
          secondForeignKey,
        })
      }

      return pivotTable
    }
  }

  return []
}

function getPivotTableName(formattedModelName: string, modelRelationTable: string): string {
  // Create an array of the model names
  const models = [formattedModelName, modelRelationTable]

  // Sort the array alphabetically
  models.sort()

  models[0] = singular(models[0] || '')
  models[1] = plural(models[1] || '')

  // Join the sorted array with an underscore
  const pivotTableName = models.join('_')

  return pivotTableName
}

function hasRelations(obj: any, key: string): boolean {
  return key in obj
}

export function pluckChanges(array1: string[], array2: string[]): { added: string[]; removed: string[] } | null {
  const removed = array1.filter((item) => !array2.includes(item))
  const added = array2.filter((item) => !array1.includes(item))

  if (removed.length === 0 && added.length === 0) {
    return null
  }

  return { added, removed }
}

export function arrangeColumns(attributes: Attributes | undefined) {
  if (!attributes) return []

  const entries = Object.entries(attributes)

  entries.sort(([keyA, valueA], [keyB, valueB]) => {
    const orderA = valueA.order ?? Number.POSITIVE_INFINITY
    const orderB = valueB.order ?? Number.POSITIVE_INFINITY
    return orderA - orderB
  })

  return entries
}

export function isArrayEqual(arr1: (number | undefined)[], arr2: (number | undefined)[]): boolean {
  if (!arr1 || !arr2) {
    return false
  }

  if (arr1.length !== arr2.length) return false

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
}

export function findDifferingKeys(obj1: any, obj2: any): { key: string; max: number; min: number }[] {
  const differingKeys: { key: string; max: number; min: number }[] = []

  for (const key in obj1) {
    if (Object.prototype.hasOwnProperty.call(obj1, key) && Object.prototype.hasOwnProperty.call(obj2, key)) {
      const lastCharacterLength = findCharacterLength(obj1[key].validation.rule)
      const latestCharacterLength = findCharacterLength(obj2[key].validation.rule)

      if (lastCharacterLength !== undefined && latestCharacterLength !== undefined) {
        if (
          lastCharacterLength.max !== latestCharacterLength.max ||
          lastCharacterLength.min !== latestCharacterLength.min
        ) {
          differingKeys.push({ key, max: latestCharacterLength.max, min: latestCharacterLength.min })
        }
      }
    }
  }

  return differingKeys
}
