import { Octokit } from "@octokit/core"
import ora from 'ora'
import type { ContributorsInfo, ContributorsInfoMap } from './types'

async function traversePagesForCount(
  requestByPage: (page: number) => Promise<any>,
) {
  let page = 1;
  const dataCollection: any[] = [];
  while (true) {
    const resp = await requestByPage(page);
    if (resp.data.length === 0) {
      break;
    }
    page++
    dataCollection.push(...resp.data)
  }
  
  return dataCollection
}

export async function fetchContributorsInfoFromPulls(params: {
  token: string,
  owner: string,
  repo: string,
}) {
  const { token, owner, repo } = params
  const octokit = new Octokit({ auth: token })
  const pullsData: any[] = []
  const loadingSpin = ora('Fetching pull requests...').start()
  try {
    const pullsRespData = await traversePagesForCount(
      (page) => octokit.request(
        'GET /repos/{owner}/{repo}/pulls{?state,page,per_page}', 
        {
          owner,
          repo,
          page,
          state: 'all',
          per_page: '100',
        }
      ), 
    )
    pullsData.push(...pullsRespData)
    loadingSpin.succeed('Fetching pull requests done')
  } catch (err) {
    console.log('Error: Fetching pull requests failed! ' + err)
  }

  const allContributorsInfos = new Map<string, ContributorsInfo>()
  pullsData.forEach(pull => {
    const [userName, avatarURL] = [pull.user.login, pull.user.avatar_url]
    const mergeTime = pull.merged_at
    if (!mergeTime) {
      // Don't collect pull requests with no merge commit
      return
    }
    const userInfoByName = allContributorsInfos.get(userName)
    if (!userInfoByName) {
      allContributorsInfos.set(userName, {
        avatarURL,
        pullRequestURLs: [pull.url],
        commitURLs: [],
      })
    } else {
      const { pullRequestURLs } = userInfoByName
      allContributorsInfos.set(userName, {
        ...userInfoByName,
        pullRequestURLs: [...pullRequestURLs, pull.url],
      })
    }
  })

  return allContributorsInfos
}

export async function supplementContributorsCommits(params: {
  token: string,
  owner: string,
  repo: string,
  contributorsMap: ContributorsInfoMap,
}) {
  const { token, owner, repo, contributorsMap } = params
  const octokit = new Octokit({ auth: token })
  const commitsData: any[] = []
  const loadingSpin = ora('Fetching commits...').start()
  try {
    const commitsRespData = await traversePagesForCount(
      (page) => octokit.request(
        'GET /repos/{owner}/{repo}/commits{?page,per_page}', 
        {
          owner,
          repo,
          page,
          per_page: '100',
        }
      ), 
    )
    commitsData.push(...commitsRespData.map((commit: any) => {
      const { commit: { author: { name: userName }, url } } = commit
      return { userName, url }
    }))
    loadingSpin.succeed('Fetching commits done')
  } catch (err) {
    console.log('Error: Fetching contributors commits failed! ' + err)
  }

  loadingSpin.start('Supplementing commits info to contributors map...')
  commitsData.forEach(commitInfo => {
    const { userName, url } = commitInfo
    const userInfoByName = contributorsMap.get(userName)
    if (!userInfoByName) {
      return
    }
    const { commitURLs } = userInfoByName
    contributorsMap.set(userName, {
      ...userInfoByName,
      commitURLs: [...commitURLs, url],
    })
  })
  loadingSpin.succeed('Supplementing commits done')
}