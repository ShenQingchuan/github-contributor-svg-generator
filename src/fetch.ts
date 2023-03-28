import { Octokit } from "@octokit/core"
import ora from 'ora'
import type { ContributorsInfo, ContributorsInfoMap } from './types'

async function traversePagesForCount(
  requestByPage: (page: number) => Promise<any>,
  breakOn?: (resp: any) => boolean,
) {
  let page = 1;
  const dataCollection: any[] = [];
  while (true) {
    const resp = await requestByPage(page);
    if (resp.data.length === 0) {
      break;
    }
    if (breakOn?.(resp)) {
      dataCollection.push(...resp.data)
      break;
    }
    page++
    dataCollection.push(...resp.data)
  }
  
  return dataCollection
}

async function getRepoCreateTime(octokit: Octokit, owner: string, repo: string) {
  try {
    const repoData = await octokit.request(
      'GET /repos/{owner}/{repo}',
      {
        owner,
        repo,
      }
    )
    return new Date(repoData.data.created_at)
  } catch (e) {
    console.error(`Fetch repo create time error: ${e}`)
    throw e
  }
}

async function getRepoCollaborators(octokit: Octokit, owner: string, repo: string) {
  try {
    const collaborators = await traversePagesForCount(
      (page) => octokit.request(
        'GET /repos/{owner}/{repo}/collaborators{?page,per_page}',
        {
          owner,
          repo,
          page,
          per_page: '100',
        }
      )
    )
    return collaborators
      .filter(item => item.type === 'User')
      .map(item => {
        const { login: userName, avatar_url: avatarURL } = item
        return { userName, avatarURL }
      })
  } catch (e) {
    console.error(`Fetch repo create time error: ${e}`)
    throw e
  }
}

export async function fetchContributorsInfo(params: {
  token: string,
  owner: string,
  repo: string,
}) {
  const { token, owner, repo } = params
  const octokit = new Octokit({ auth: token })
  const pullsData: any[] = []
  const loadingSpin = ora('Fetching pull requests...').start()
  
  // Fisrt, collect from Pull Requests' sender
  try {
    const pullsRespData = await traversePagesForCount(
      (page) => octokit.request(
        'GET /repos/{owner}/{repo}/pulls{?state,page,per_page}', 
        {
          owner,
          repo,
          page,
          state: 'closed',
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
      userInfoByName.pullRequestURLs.push(pull.url)
    }
  })

  // count commits for all contributors we got in the map now
  await supplementContributorsCommits({ 
    token, 
    repo, 
    owner,
    contributorsMap: allContributorsInfos 
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
  
  const repoCreateTime = await getRepoCreateTime(
    octokit,
    owner,
    repo
  );

  const loadingSpin = ora('Fetching commits...').start()
  try {
    const commitsRespData = await traversePagesForCount(
      (page) => octokit.request(
        'GET /repos/{owner}/{repo}/commits{?page,per_page,since}', 
        {
          owner,
          repo,
          page,
          per_page: '100',
        }
      ),
      (resp) => {
        const commits = resp.data
        if (commits.some((commit: any) => {
          const { commit: { author: { date } } } = commit
          return new Date(date).getTime() < repoCreateTime.getTime()
        })) {
          return true
        }

        return false
      }
    )
    commitsData.push(...commitsRespData
      .filter((commit: any) => Boolean(commit?.author?.login))
      .map((commit: any) => {
        const { author: { login: userName }, commit: { author: { date }, url } } = commit
        return { userName, url, date }
      })
    )
    loadingSpin.succeed('Fetching commits done')
  } catch (err) {
    console.log('Error: Fetching contributors commits failed! ' + err)
  }

  loadingSpin.start('Supplementing commits info to contributors map...')
  commitsData
    .filter(
      commit => new Date(commit.date).getTime() > repoCreateTime.getTime()
    )
    .forEach(commitInfo => {
    const { userName, url } = commitInfo
    const foundUserInfoByName = contributorsMap.get(userName)
    if (!foundUserInfoByName) {
      return
    }
    
    const userInfoByName = contributorsMap.get(userName)!
    if (!userInfoByName.commitURLs) {
      userInfoByName.commitURLs = []
    }
    userInfoByName.commitURLs.push(url)
  })
  loadingSpin.succeed('Supplementing commits done')
}