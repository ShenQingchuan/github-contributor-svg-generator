import { program } from 'commander'
import { fetchContributorsInfo } from './fetch'
import { checkContribsPersistence, saveContribsPersistence } from './persistence'
import { saveSVG as saveSVG } from './save-svg'
import { generateContributorsSVGFile } from './svg-codegen'
import { getDefaultValue, getRepoName } from './utils'
import type { CliOptions } from './types'


async function main() {
  const { Github_token: defaultToken, Github_owner: defaultOwner } = process.env
  const defaultRepoName = await getRepoName()
  const GITHUBReg = /https:\/\/github.com\/([\w\-_]+)\/([\w\-_]+)/
  let urlInfo = null
  program
    .name('gh-contrib-svg')
    .arguments('[url]')
    .option('-t, --token <token>', 'Personal GitHub token', defaultToken)
    .option('-o, --owner <owner>', 'Repo owner name', defaultOwner)
    .option('-r, --repo <repo>', 'GitHub repo path', defaultRepoName)
    .option('-s, --size <size>', 'Single avatar block size (pixel)', "120")
    .option('-w, --width <width>', 'Output image width (pixel)', "1000")
    .option('-c, --count <count>', 'Avatar count in one line', "8")
    .action((url) => {
      if (!url) return
      const match = url.match(GITHUBReg)
      if (!match)
        throw new Error('Invalid GitHub Repo URL')
      const [_, owner, repo] = match
      urlInfo = {
        owner,
        repo
      }
    })
    .parse(process.argv)
  const options = Object.assign(program.opts(), urlInfo)
  const { token, repo, owner, size: avatarBlockSize, width, count: lineCount } = options as CliOptions

  if (token && repo && owner) {
    const startTime = performance.now()
    const allContributorsInfos = await fetchContributorsInfo({ token, repo, owner })

    // sort contributors by commit count and pull request count
    const sortedContributors = [...allContributorsInfos.entries()]
      .sort(([, userInfoA], [, userInfoB]) => {
        const countA = userInfoA.commitURLs.length + userInfoA.pullRequestURLs.length
        const countB = userInfoB.commitURLs.length + userInfoB.pullRequestURLs.length
        return countB - countA
      })
    const identifier = `${owner}_${repo}`
    const contribUserNames = sortedContributors.map(([userName,]) => userName);
    checkContribsPersistence(
      contribUserNames,
      identifier
    )

    const svgString = await generateContributorsSVGFile({
      imgWidth: Number(width),
      blockSize: Number(avatarBlockSize),
      lineCount: Number(lineCount),
    }, new Map(sortedContributors))

    saveSVG(svgString, identifier);
    saveContribsPersistence(
      contribUserNames,
      identifier
    )

    const endTime = performance.now()
    console.log(`Time cost: ${Math.round((endTime - startTime) / 1000)}s`)
  } else {
    if (!token)
      throw new Error('Personal GitHub token is required')
    if (!repo)
      throw new Error('Repo owner name is required')
    if (!owner)
      throw new Error('GitHub repo path is required')
  }
}

main()
