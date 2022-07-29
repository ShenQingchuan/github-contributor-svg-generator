import { program } from 'commander'
import { fetchContributorsInfoFromPulls, supplementContributorsCommits } from './fetch'
import { generatePNG } from './generate-png'
import { generateContributorsSVGFile } from './svg-codegen'

async function main() {
  program
    .option('-t, --token <token>', 'Personal GitHub token')
    .option('-o, --owner <owner>', 'Repo owner name')
    .option('-r, --repo <repo>', 'GitHub repo path')
    .option('--tinypng <tinypng>', 'TinyPNG API key')
    .parse(process.argv)

  const options = program.opts()
  const { token, repo, owner, tinypng } = options
  if (token && repo && owner && tinypng) {
    const allContributorsInfos = await fetchContributorsInfoFromPulls({ token, repo, owner })
    // count commits for all contributors we got in the map now
    await supplementContributorsCommits({ token, repo, owner, contributorsMap: allContributorsInfos })

    // sort contributors by commit count and pull request count
    const sortedContributors = [...allContributorsInfos.entries()]
      .sort(([, userInfoA], [, userInfoB]) => {
        const countA = userInfoA.commitURLs.length + userInfoA.pullRequestURLs.length
        const countB = userInfoB.commitURLs.length + userInfoB.pullRequestURLs.length
        return countB - countA
      })
    const svgString = generateContributorsSVGFile({
      imgWidth: 1200,
      blockSize: 80,
      lineCount: 14,
    }, sortedContributors)
    await generatePNG({
      identifier: `${owner}/${repo}`,
      tinyPNGAPIKey: tinypng,
      svgString,
    })
  }
}  

main()
