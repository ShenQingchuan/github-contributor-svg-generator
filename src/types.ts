export interface CliOptions {
  token: string // Github access token
  owner: string
  repo: string
  size: string
  width: string
  count: string
}
export interface ContributorsInfo {
  avatarURL: string,
  pullRequestURLs: string[]
  commitURLs: string[]
}
export type ContributorsInfoMap = Map<string, ContributorsInfo>
