import { request } from '@stacksjs/router'
import AccessToken from '../../../orm/src/models/AccessToken'
import Team from '../../../orm/src/models/Team'
import User from '../../../orm/src/models/User'

interface Credentials {
  password: string | number | undefined
  [key: string]: string | number | undefined
}

const authConfig = { username: 'email', password: 'password' }

let authUser: any = undefined

export async function attempt(credentials: Credentials, remember?: boolean) {
  const user = await User.where(authConfig.username, credentials[authConfig.username])
    .where(authConfig.password, credentials[authConfig.password])
    .first()

  if (user) {
    authUser = user

    return true
  }

  return false
}

export async function team() {
  if (authUser) {
    const teams = await authUser.userTeams()

    //TODO: reconfigure model instance
    return teams[0].team
  }

  // tokenId:teamId:tokenString
  const bearerToken = request.bearerToken()

  if (!bearerToken) {
    return undefined
  }

  const parts = bearerToken.split(':')

  if (parts.length !== 3) {
    throw { message: 'Invalid bearer token format', status: 401 }
  }

  const tokenId = Number(parts[0])
  const teamId = parts[1]
  const plainString = parts[2]

  const accessToken = await AccessToken.where('id', Number(tokenId)).where('token', plainString).first()

  if (Number(teamId) !== Number(accessToken?.team_id)) {
    return undefined
  }

  const team = await Team.find(Number(accessToken?.team_id))

  return team
}

export async function authToken() {
  if (authUser) {
    const teams = await authUser.userTeams()

    const team = teams[0]

    const accessToken = await AccessToken.where('team_id', team.id).first()

    const tokenId = accessToken?.id

    if (!accessToken) {
      throw { error: 'Error generating token!' }
    }

    return `${tokenId}:${team.id}:${accessToken.token}`
  }
}
