import { generateTwoFactorSecret } from '@stacksjs/auth'
import { verifyTwoFactorCode } from '@stacksjs/auth'
import { db } from '@stacksjs/database'
import { sql } from '@stacksjs/database'
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'
import Post from './Post'

import Subscriber from './Subscriber'

import Deployment from './Deployment'

import Team from './Team'

// import { Kysely, MysqlDialect, PostgresDialect } from 'kysely'
// import { Pool } from 'pg'

// TODO: we need an action that auto-generates these table interfaces
export interface UsersTable {
  id: Generated<number>
  name: string
  email: string
  jobTitle: string
  password: string
  team_id: number
  deployment_id: number
  post_id: number
  two_factor_secret: string

  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, never>
  deleted_at: ColumnType<Date, string | undefined, never>
}

interface UserResponse {
  data: Users
  paging: {
    total_records: number
    page: number
    total_pages: number
  }
  next_cursor: number | null
}

export type UserType = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>
export type Users = UserType[]

export type UserColumn = Users
export type UserColumns = Array<keyof Users>

type SortDirection = 'asc' | 'desc'
interface SortOptions {
  column: UserType
  order: SortDirection
}
// Define a type for the options parameter
interface QueryOptions {
  sort?: SortOptions
  limit?: number
  offset?: number
  page?: number
}

export class UserModel {
  private user: Partial<UserType> | null
  private hidden = ['password']
  private fillable = []
  protected query: any
  protected hasSelect: boolean
  public id: number | undefined
  public two_factor_secret: string | undefined
  public name: string | undefined
  public email: string | undefined
  public jobTitle: string | undefined
  public password: string | undefined
  public team_id: number | undefined
  public deployment_id: number | undefined
  public post_id: number | undefined

  constructor(user: Partial<UserType> | null) {
    this.user = user
    this.id = user?.id
    this.two_factor_secret = user?.two_factor_secret
    this.name = user?.name
    this.email = user?.email
    this.jobTitle = user?.jobTitle
    this.password = user?.password
    this.team_id = user?.team_id
    this.deployment_id = user?.deployment_id
    this.post_id = user?.post_id

    this.query = db.selectFrom('users')
    this.hasSelect = false
  }

  // Method to find a User by ID
  async find(id: number, fields?: (keyof UserType)[]): Promise<UserModel | undefined> {
    let query = db.selectFrom('users').where('id', '=', id)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.executeTakeFirst()

    if (!model) return undefined

    return this.parseResult(this)
  }

  // Method to find a User by ID
  static async find(id: number, fields?: (keyof UserType)[]): Promise<UserModel | undefined> {
    let query = db.selectFrom('users').where('id', '=', id)

    const instance = new this(null)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.executeTakeFirst()

    if (!model) return undefined

    return instance.parseResult(new this(model))
  }

  static async findOrFail(id: number, fields?: (keyof UserType)[]): Promise<UserModel> {
    let query = db.selectFrom('users').where('id', '=', id)

    const instance = new this(null)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.executeTakeFirst()

    if (!model) throw `No model results found for ${id} `

    return instance.parseResult(new this(model))
  }

  static async findMany(ids: number[], fields?: (keyof UserType)[]): Promise<UserModel[]> {
    let query = db.selectFrom('users').where('id', 'in', ids)

    const instance = new this(null)

    if (fields) query = query.select(fields)
    else query = query.selectAll()

    const model = await query.execute()

    instance.parseResult(new UserModel(modelItem))

    return model.map((modelItem) => instance.parseResult(new UserModel(modelItem)))
  }

  // Method to get a User by criteria
  static async fetch(criteria: Partial<UserType>, options: QueryOptions = {}): Promise<UserModel[]> {
    let query = db.selectFrom('users')

    // Apply sorting from options
    if (options.sort) query = query.orderBy(options.sort.column, options.sort.order)

    // Apply limit and offset from options
    if (options.limit !== undefined) query = query.limit(options.limit)

    if (options.offset !== undefined) query = query.offset(options.offset)

    const model = await query.selectAll().execute()
    return model.map((modelItem) => new UserModel(modelItem))
  }

  // Method to get a User by criteria
  static async get(): Promise<UserModel[]> {
    const query = db.selectFrom('users')

    const model = await query.selectAll().execute()

    return model.map((modelItem) => new UserModel(modelItem))
  }

  // Method to get a User by criteria
  async get(): Promise<UserModel[]> {
    if (this.hasSelect) {
      const model = await this.query.execute()

      return model.map((modelItem: UserModel) => new UserModel(modelItem))
    }

    const model = await this.query.selectAll().execute()

    return model.map((modelItem: UserModel) => new UserModel(modelItem))
  }

  static async count(): Promise<number> {
    const instance = new this(null)

    const results = await instance.query.selectAll().execute()

    return results.length
  }

  async count(): Promise<number> {
    if (this.hasSelect) {
      const results = await this.query.execute()

      return results.length
    }

    const results = await this.query.selectAll().execute()

    return results.length
  }

  // Method to get all users
  static async paginate(options: QueryOptions = { limit: 10, offset: 0, page: 1 }): Promise<UserResponse> {
    const totalRecordsResult = await db
      .selectFrom('users')
      .select(db.fn.count('id').as('total')) // Use 'id' or another actual column name
      .executeTakeFirst()

    const totalRecords = Number(totalRecordsResult?.total) || 0
    const totalPages = Math.ceil(totalRecords / (options.limit ?? 10))

    const usersWithExtra = await db
      .selectFrom('users')
      .selectAll()
      .orderBy('id', 'asc') // Assuming 'id' is used for cursor-based pagination
      .limit((options.limit ?? 10) + 1) // Fetch one extra record
      .offset(((options.page ?? 1) - 1) * (options.limit ?? 10)) // Ensure options.page is not undefined
      .execute()

    let nextCursor = null
    if (usersWithExtra.length > (options.limit ?? 10)) nextCursor = usersWithExtra.pop()?.id // Use the ID of the extra record as the next cursor

    return {
      data: usersWithExtra,
      paging: {
        total_records: totalRecords,
        page: options.page ?? 0,
        total_pages: totalPages,
      },
      next_cursor: nextCursor ?? null,
    }
  }

  // Method to create a new user
  static async create(newUser: NewUser): Promise<UserModel | undefined> {
    const instance = new this(null)
    const filteredValues = Object.keys(newUser)
      .filter((key) => instance.fillable.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = newUser[key]
        return obj
      }, {})

    if (Object.keys(filteredValues).length === 0) {
      return undefined
    }

    const result = await db.insertInto('users').values(filteredValues).executeTakeFirstOrThrow()

    return (await find(Number(result.insertId))) as UserModel
  }

  // Method to remove a User
  static async remove(id: number): Promise<void> {
    await db.deleteFrom('users').where('id', '=', id).execute()
  }

  where(...args: (string | number | boolean | undefined | null)[]): UserModel {
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

  static where(...args: (string | number | boolean | undefined | null)[]): UserModel {
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

  static whereName(value: string | number | boolean | undefined | null): UserModel {
    const instance = new this(null)

    instance.query = instance.query.where('name', '=', value)

    return instance
  }

  static whereEmail(value: string | number | boolean | undefined | null): UserModel {
    const instance = new this(null)

    instance.query = instance.query.where('email', '=', value)

    return instance
  }

  static whereJobTitle(value: string | number | boolean | undefined | null): UserModel {
    const instance = new this(null)

    instance.query = instance.query.where('jobTitle', '=', value)

    return instance
  }

  static wherePassword(value: string | number | boolean | undefined | null): UserModel {
    const instance = new this(null)

    instance.query = instance.query.where('password', '=', value)

    return instance
  }

  static whereIn(column: keyof UserType, values: any[]): UserModel {
    const instance = new this(null)

    instance.query = instance.query.where(column, 'in', values)

    return instance
  }

  async first(): Promise<UserModel | undefined> {
    const model = await this.query.selectAll().executeTakeFirst()

    if (!model) {
      return undefined
    }

    return new UserModel(model)
  }

  async exists(): Promise<boolean> {
    const model = await this.query.selectAll().executeTakeFirst()

    return model !== null || model !== undefined
  }

  static async first(): Promise<UserType | undefined> {
    return await db.selectFrom('users').selectAll().executeTakeFirst()
  }

  async last(): Promise<UserType | undefined> {
    return await db.selectFrom('users').selectAll().orderBy('id', 'desc').executeTakeFirst()
  }

  static orderBy(column: keyof UserType, order: 'asc' | 'desc'): UserModel {
    const instance = new this(null)

    instance.query = instance.orderBy(column, order)

    return instance
  }

  orderBy(column: keyof UserType, order: 'asc' | 'desc'): UserModel {
    this.query = this.query.orderBy(column, order)

    return this
  }

  static orderByDesc(column: keyof UserType): UserModel {
    const instance = new this(null)

    instance.query = instance.query.orderBy(column, 'desc')

    return instance
  }

  orderByDesc(column: keyof UserType): UserModel {
    this.query = this.orderBy(column, 'desc')

    return this
  }

  static orderByAsc(column: keyof UserType): UserModel {
    const instance = new this(null)

    instance.query = instance.query.orderBy(column, 'desc')

    return instance
  }

  orderByAsc(column: keyof UserType): UserModel {
    this.query = this.query.orderBy(column, 'desc')

    return this
  }

  // Method to update the users instance
  async update(user: UserUpdate): Promise<UserModel | null> {
    if (this.id === undefined) throw new Error('User ID is undefined')

    const filteredValues = Object.keys(newUser)
      .filter((key) => this.fillable.includes(key))
      .reduce((obj, key) => {
        obj[key] = newUser[key]
        return obj
      }, {})

    await db.updateTable('users').set(filteredValues).where('id', '=', this.id).executeTakeFirst()

    return await this.find(Number(this.id))
  }

  // Method to save (insert or update) the user instance
  async save(): Promise<void> {
    if (!this.user) throw new Error('User data is undefined')

    if (this.user.id === undefined) {
      // Insert new user
      const newModel = await db
        .insertInto('users')
        .values(this.user as NewUser)
        .executeTakeFirstOrThrow()
    } else {
      // Update existing user
      await this.update(this.user)
    }
  }

  // Method to delete the user instance
  async delete(): Promise<void> {
    if (this.id === undefined) throw new Error('User ID is undefined')

    await db.deleteFrom('users').where('id', '=', this.id).execute()
  }

  async post() {
    if (this.id === undefined) throw new Error('Relation Error!')

    const model = Post.where('user_id', '=', this.id).first()

    if (!model) throw new Error('Model Relation Not Found!')

    return model
  }

  async subscriber() {
    if (this.id === undefined) throw new Error('Relation Error!')

    const model = Subscriber.where('user_id', '=', this.id).first()

    if (!model) throw new Error('Model Relation Not Found!')

    return model
  }

  async deployments() {
    if (this.id === undefined) throw new Error('Relation Error!')

    const results = await db.selectFrom('deployments').where('user_id', '=', this.id).selectAll().execute()

    return results
  }

  async userTeams() {
    if (this.id === undefined) throw new Error('Relation Error!')

    const results = await db.selectFrom('team_users').where('user_id', '=', this.id).selectAll().execute()

    const tableRelationIds = results.map((result) => result.team_id)

    const relationResults = await Team.whereIn('id', tableRelationIds).get()

    return relationResults
  }

  distinct(column: keyof UserType): UserModel {
    this.query = this.query.distinctOn(column)

    return this
  }

  static distinct(column: keyof UserType): UserModel {
    const instance = new this(null)

    instance.query = instance.query.distinctOn(column)

    return instance
  }

  join(table: string, firstCol: string, secondCol: string): UserModel {
    this.query = this.query.innerJoin(table, firstCol, secondCol)

    return this
  }

  static join(table: string, firstCol: string, secondCol: string): UserModel {
    const instance = new this(null)

    instance.query = instance.query.innerJoin(table, firstCol, secondCol)

    return instance
  }

  static async rawQuery(rawQuery: string): Promise<any> {
    return await sql`${rawQuery}`.execute(db)
  }

  toJSON() {
    const output: Partial<UserType> = { ...this.user }

    this.hidden.forEach((attr) => {
      if (attr in output) delete output[attr as keyof Partial<UserType>]
    })

    type User = Omit<UserType, 'password'>

    return output as User
  }

  parseResult(model: any): UserModel {
    for (const hiddenAttribute of this.hidden) {
      delete model[hiddenAttribute]
      delete model.user[hiddenAttribute]
    }

    return model
  }

  async generateTwoFactorForModel() {
    const secret = generateTwoFactorSecret()

    await this.update({ two_factor_secret: secret })
  }

  verifyTwoFactorCode(code: string): boolean {
    if (!this.user) return false

    const modelTwoFactorSecret = this.user.two_factor_secret
    const isValid = verifyTwoFactorCode(code, modelTwoFactorSecret)

    return isValid
  }
}

async function find(id: number, fields?: (keyof UserType)[]): Promise<UserModel | null> {
  let query = db.selectFrom('users').where('id', '=', id)

  if (fields) query = query.select(fields)
  else query = query.selectAll()

  const model = await query.executeTakeFirst()

  if (!model) return null

  return new UserModel(model)
}

export async function count(): Promise<number> {
  const results = await UserModel.count()

  return results
}

export async function create(newUser: NewUser): Promise<UserModel> {
  const result = await db.insertInto('users').values(newUser).executeTakeFirstOrThrow()

  return (await find(Number(result.insertId))) as UserModel
}

export async function rawQuery(rawQuery: string): Promise<any> {
  return await sql`${rawQuery}`.execute(db)
}

export async function remove(id: number): Promise<void> {
  await db.deleteFrom('users').where('id', '=', id).execute()
}

export async function whereName(value: string | number | boolean | undefined | null): Promise<UserModel[]> {
  const query = db.selectFrom('users').where('name', '=', value)

  const results = await query.execute()

  return results.map((modelItem) => new UserModel(modelItem))
}

export async function whereEmail(value: string | number | boolean | undefined | null): Promise<UserModel[]> {
  const query = db.selectFrom('users').where('email', '=', value)

  const results = await query.execute()

  return results.map((modelItem) => new UserModel(modelItem))
}

export async function whereJobTitle(value: string | number | boolean | undefined | null): Promise<UserModel[]> {
  const query = db.selectFrom('users').where('jobTitle', '=', value)

  const results = await query.execute()

  return results.map((modelItem) => new UserModel(modelItem))
}

export async function wherePassword(value: string | number | boolean | undefined | null): Promise<UserModel[]> {
  const query = db.selectFrom('users').where('password', '=', value)

  const results = await query.execute()

  return results.map((modelItem) => new UserModel(modelItem))
}

const User = UserModel

export default User
