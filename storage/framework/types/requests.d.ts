import { Request } from '../core/router/src/request'

interface ValidationField {
   rule: ReturnType<typeof schema.string>
    message: Record<string, string>
  }

interface CustomAttributes {
    [key: string]: ValidationField
  }

interface RequestDataProject {
       id?: number
 name: string
      description: string
      url: string
      status: string
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface ProjectRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'name' |'description' |'url' |'status'): string | number | undefined
      all(): RequestDataProject
       id?: number
 name: string
      description: string
      url: string
      status: string
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataSubscriberEmail {
       id?: number
 email: string
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface SubscriberEmailRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'email'): string | number | undefined
      all(): RequestDataSubscriberEmail
       id?: number
 email: string
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataAccessToken {
       id?: number
 name: string
      token: string
      plainTextToken: string
      abilities: string[]
      team_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface AccessTokenRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'name' |'token' |'plainTextToken' |'abilities' |'team_id'): string | number | undefined
      all(): RequestDataAccessToken
       id?: number
 name: string
      token: string
      plainTextToken: string
      abilities: string[]
      team_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataTeam {
       id?: number
 name: string
      companyName: string
      email: string
      billingEmail: string
      status: string
      description: string
      path: string
      isPersonal: boolean
      accesstoken_id: number
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface TeamRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'name' |'companyName' |'email' |'billingEmail' |'status' |'description' |'path' |'isPersonal' |'accesstoken_id' |'user_id'): string | number | undefined
      all(): RequestDataTeam
       id?: number
 name: string
      companyName: string
      email: string
      billingEmail: string
      status: string
      description: string
      path: string
      isPersonal: boolean
      accesstoken_id: number
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataSubscriber {
       id?: number
 subscribed: boolean
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface SubscriberRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'subscribed' |'user_id'): string | number | undefined
      all(): RequestDataSubscriber
       id?: number
 subscribed: boolean
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataDeployment {
       id?: number
 commitSha: string
      commitMessage: string
      branch: string
      status: string
      executionTime: number
      deployScript: string
      terminalOutput: string
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface DeploymentRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'commitSha' |'commitMessage' |'branch' |'status' |'executionTime' |'deployScript' |'terminalOutput' |'user_id'): string | number | undefined
      all(): RequestDataDeployment
       id?: number
 commitSha: string
      commitMessage: string
      branch: string
      status: string
      executionTime: number
      deployScript: string
      terminalOutput: string
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataRelease {
       id?: number
 version: string
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface ReleaseRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'version'): string | number | undefined
      all(): RequestDataRelease
       id?: number
 version: string
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataUser {
       id?: number
 name: string
      email: string
      jobTitle: string
      password: string
      team_id: number
      deployment_id: number
      post_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface UserRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'name' |'email' |'jobTitle' |'password' |'team_id' |'deployment_id' |'post_id'): string | number | undefined
      all(): RequestDataUser
       id?: number
 name: string
      email: string
      jobTitle: string
      password: string
      team_id: number
      deployment_id: number
      post_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

interface RequestDataPost {
       id?: number
 title: string
      body: string
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }
export interface PostRequestType extends Request {
      validate(attributes?: CustomAttributes): void
      get(key: 'id' |'title' |'body' |'user_id'): string | number | undefined
      all(): RequestDataPost
       id?: number
 title: string
      body: string
      user_id: number
     created_at?: string
      updated_at?: string
      deleted_at?: string
    }

export type ModelRequest = ProjectRequestType | SubscriberEmailRequestType | AccessTokenRequestType | TeamRequestType | SubscriberRequestType | DeploymentRequestType | ReleaseRequestType | UserRequestType | PostRequestType