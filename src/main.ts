import { program } from 'commander'
import { fetchContributorsInfoFromPulls, supplementContributorsCommits } from './fetch'
import { generateContributorsSVGFile } from './svg-codegen'

async function main() {
  program
    .option('-t, --token <token>', 'Personal GitHub token')
    .option('-o, --owner <owner>', 'Repo owner name')
    .option('-r, --repo <repo>', 'GitHub repo path')
    .parse(process.argv)

  const options = program.opts()
  const { token, repo, owner } = options
  if (token && repo && owner) {
    const allContributorsInfos = await fetchContributorsInfoFromPulls({ token, repo, owner })
    // count commits for all contributors we got in the map now
    await supplementContributorsCommits({ token, repo, owner, contributorsMap: allContributorsInfos })

    // sort contributors by commit count and pull request count
    const sortedUserNamesByContribuitionsCount = [...allContributorsInfos.entries()]
      .sort(([, userInfoA], [, userInfoB]) => {
        const countA = userInfoA.commitURLs.length + userInfoA.pullRequestURLs.length
        const countB = userInfoB.commitURLs.length + userInfoB.pullRequestURLs.length
        return countB - countA
      })
    generateContributorsSVGFile({
      imgWidth: 1200,
      blockSize: 80,
      lineCount: 14,
    }, sortedUserNamesByContribuitionsCount)
  }
}  

main()
