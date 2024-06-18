import { db } from '@stacksjs/database'
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

// import { Kysely, MysqlDialect, PostgresDialect } from 'kysely'
// import { Pool } from 'pg'

// TODO: we need an action that auto-generates these table interfaces
export interface ReleasesTable {
  id: Generated<number>
  version: string

  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, never>
  deleted_at: ColumnType<Date, string | undefined, never>
}

interface ReleaseResponse {
  data: Releases
  paging: {
    total_records: number
    page: number
    total_pages: number
  }
  next_cursor: number | null
}

export type ReleaseType = Selectable<ReleasesTable>
export type NewRelease = Insertable<ReleasesTable>
export type ReleaseUpdate = Updateable<ReleasesTable>
export type Releases = ReleaseType[]

export type ReleaseColumn = Releases
export type ReleaseColumns = Array<keyof Releases>

type SortDirection = 'asc' | 'desc'
interface SortOptions {
  column: ReleaseType
  order: SortDirection
}
// Define a type for the options parameter
interface QueryOptions {
  sort?: SortOptions
  limit?: number
  offset?: number
  page?: number
}

export class ReleaseModel {
  private release: Partial<ReleaseType> | null
  private results: Partial<ReleaseType>[]
  private hidden = ['password'] // TODO: this hidden functionality needs to be implemented still
  protected query: any
  protected hasSelect: boolean
  public id: number | undefined
  public version: string | undefined

  constructor(release: Partial<ReleaseType> | null) {
    this.release = release
    this.id = release?.id
    this.version = release?.version

    this.query = db.selectFrom('releases')
    this.hasSelect = false
  }

  // Method to find a Release by ID
  async find(id: number, fields?: (keyof ReleaseType)[]): Promise<ReleaseModel | null> {
    let query = db.selectFrom('releases').where('id', '=', id)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.executeTakeFirst()

    if (!model) return null

    return this
  }

  // Method to find a Release by ID
  static async find(id: number, fields?: (keyof ReleaseType)[]): Promise<ReleaseModel | null> {
    let query = db.selectFrom('releases').where('id', '=', id)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.executeTakeFirst()

    if (!model) return null

    return new this(model)
  }

  static async findOrFail(id: number, fields?: (keyof ReleaseType)[]): Promise<ReleaseModel> {
    let query = db.selectFrom('releases').where('id', '=', id)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.executeTakeFirst()

    if (!model) throw `No model results found for ${id} `

    return new this(model)
  }

  static async findMany(ids: number[], fields?: (keyof ReleaseType)[]): Promise<ReleaseModel[]> {
    let query = db.selectFrom('releases').where('id', 'in', ids)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.execute()

    return model.map((modelItem) => new ReleaseModel(modelItem))
  }

  // Method to get a Release by criteria
  static async fetch(criteria: Partial<ReleaseType>, options: QueryOptions = {}): Promise<ReleaseModel[]> {
    let query = db.selectFrom('releases')

    // Apply sorting from options
    if (options.sort) query = query.orderBy(options.sort.column, options.sort.order)

    // Apply limit and offset from options
    if (options.limit !== undefined) query = query.limit(options.limit)

    if (options.offset !== undefined) query = query.offset(options.offset)

    const model = await query.selectAll().execute()
    return model.map((modelItem) => new ReleaseModel(modelItem))
  }

  // Method to get a Release by criteria
  static async get(): Promise<ReleaseModel[]> {
    const query = db.selectFrom('releases')

    const model = await query.selectAll().execute()

    return model.map((modelItem) => new ReleaseModel(modelItem))
  }

  // Method to get a Release by criteria
  async get(): Promise<ReleaseModel[]> {
    if (this.hasSelect) {
      const model = await this.query.execute()

      return model.map((modelItem: ReleaseModel) => new ReleaseModel(modelItem))
    }

    const model = await this.query.selectAll().execute()

    return model.map((modelItem: ReleaseModel) => new ReleaseModel(modelItem))
  }

  // Method to get all releases
  static async paginate(options: QueryOptions = { limit: 10, offset: 0, page: 1 }): Promise<ReleaseResponse> {
    const totalRecordsResult = await db
      .selectFrom('releases')
      .select(db.fn.count('id').as('total')) // Use 'id' or another actual column name
      .executeTakeFirst()

    const totalRecords = Number(totalRecordsResult?.total) || 0
    const totalPages = Math.ceil(totalRecords / (options.limit ?? 10))

    const releasesWithExtra = await db
      .selectFrom('releases')
      .selectAll()
      .orderBy('id', 'asc') // Assuming 'id' is used for cursor-based pagination
      .limit((options.limit ?? 10) + 1) // Fetch one extra record
      .offset((options.page - 1) * (options.limit ?? 10))
      .execute()

    let nextCursor = null
    if (releasesWithExtra.length > (options.limit ?? 10)) nextCursor = releasesWithExtra.pop()!.id // Use the ID of the extra record as the next cursor

    return {
      data: releasesWithExtra,
      paging: {
        total_records: totalRecords,
        page: options.page,
        total_pages: totalPages,
      },
      next_cursor: nextCursor,
    }
  }

  // Method to create a new release
  static async create(releases: NewRelease): Promise<ReleaseModel> {
    const result = await db.insertInto('releases').values(newRelease).executeTakeFirstOrThrow()

    return (await find(Number(result.insertId))) as ReleaseModel
  }

  // Method to remove a Release
  static async remove(id: number): Promise<void> {
    await db.deleteFrom('releases').where('id', '=', id).execute()
  }

  where(...args: (string | number)[]): ReleaseModel {
    let column: any
    let operator: any
    let value: any

    if (args.length === 2) {
      ;[column, value] = args
      operator = '='
    } else if (args.length === 3) {
      ;[column, operator, value] = args
    } else {
      throw new Error('Invalid number of arguments')
    }

    this.query = this.query.where(column, operator, value)

    return this
  }

  static whereVersion(value: string | number | boolean): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.query.where('version', '=', value)

    return instance
  }

  static where(...args: (string | number)[]): ReleaseModel {
    let column: any
    let operator: any
    let value: any

    const instance = new this(null)

    if (args.length === 2) {
      ;[column, value] = args
      operator = '='
    } else if (args.length === 3) {
      ;[column, operator, value] = args
    } else {
      throw new Error('Invalid number of arguments')
    }

    instance.query = instance.query.where(column, operator, value)

    return instance
  }

  static whereIn(column: keyof ReleaseType, values: any[]): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.query.where(column, 'in', values)

    return instance
  }

  async first(): Promise<ReleaseModel | undefined> {
    const model = await this.query.selectAll().executeTakeFirst()

    return new ReleaseModel(model)
  }

  static async first(): Promise<ReleaseType | undefined> {
    return await db.selectFrom('releases').selectAll().executeTakeFirst()
  }

  async last(): Promise<ReleaseType | undefined> {
    return await db.selectFrom('releases').selectAll().orderBy('id', 'desc').executeTakeFirst()
  }

  static orderBy(column: keyof ReleaseType, order: 'asc' | 'desc'): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.orderBy(column, order)

    return instance
  }

  orderBy(column: keyof ReleaseType, order: 'asc' | 'desc'): ReleaseModel {
    this.query = this.query.orderBy(column, order)

    return this
  }

  static orderByDesc(column: keyof ReleaseType): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.query.orderBy(column, 'desc')

    return instance
  }

  orderByDesc(column: keyof ReleaseType): ReleaseModel {
    this.query = this.orderBy(column, 'desc')

    return this
  }

  static orderByAsc(column: keyof ReleaseType): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.query.orderBy(column, 'desc')

    return instance
  }

  orderByAsc(column: keyof ReleaseType): ReleaseModel {
    this.query = this.query.orderBy(column, 'desc')

    return this
  }

  // Method to update the releases instance
  async update(release: ReleaseUpdate): Promise<ReleaseModel | null> {
    if (this.id === undefined) throw new Error('Release ID is undefined')

    const updatedModel = await db.updateTable('releases').set(release).where('id', '=', this.id).executeTakeFirst()

    return await this.find(Number(this.id))
  }

  // Method to save (insert or update) the release instance
  async save(): Promise<void> {
    if (!this.release) throw new Error('Release data is undefined')

    if (this.release.id === undefined) {
      // Insert new release
      const newModel = await db
        .insertInto('releases')
        .values(this.release as NewRelease)
        .executeTakeFirstOrThrow()
    } else {
      // Update existing release
      await this.update(this.release)
    }
  }

  // Method to delete the release instance
  async delete(): Promise<void> {
    if (this.id === undefined) throw new Error('Release ID is undefined')

    await db.deleteFrom('releases').where('id', '=', this.id).execute()
  }

  distinct(column: keyof ReleaseType): ReleaseModel {
    this.query = this.query.distinctOn(column)

    return this
  }

  static distinct(column: keyof ReleaseType): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.query.distinctOn(column)

    return instance
  }

  join(table: string, firstCol: string, secondCol: string): ReleaseModel {
    this.query = this.query.innerJoin(table, firstCol, secondCol)

    return this
  }

  static join(table: string, firstCol: string, secondCol: string): ReleaseModel {
    const instance = new this(null)

    instance.query = instance.query.innerJoin(table, firstCol, secondCol)

    return instance
  }

  toJSON() {
    const output: Partial<ReleaseType> = { ...this.release }

    this.hidden.forEach((attr) => {
      if (attr in output) delete output[attr as keyof Partial<ReleaseType>]
    })

    type Release = Omit<ReleaseType, 'password'>

    return output as Release
  }
}

const Release = ReleaseModel

export default Release
