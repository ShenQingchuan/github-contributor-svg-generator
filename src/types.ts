export interface CliOptions {
  token: string // Github access token
  owner: string
  repo: string
  tinypng: string // TinyPNG token
}
export interface ContributorsInfo {
  avatarURL: string,
  pullRequestURLs: string[]
  commitURLs: string[]
}
export type ContributorsInfoMap = Map<string, ContributorsInfo>
