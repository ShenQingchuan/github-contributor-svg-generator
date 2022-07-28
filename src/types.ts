export interface ContributorsInfo {
  avatarURL: string,
  pullRequestURLs: string[]
  commitURLs: string[]
}
export type ContributorsInfoMap = Map<string, ContributorsInfo>
