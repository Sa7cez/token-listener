export interface TwitterAccount {
  username: string
  password: string
  email: string
  auth_token: string
}

export type Proxy = {
  url: string
  link?: string
}
