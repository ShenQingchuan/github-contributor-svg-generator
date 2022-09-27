import { program } from 'commander'
import { fetchContributorsInfoFromPulls, supplementContributorsCommits } from './fetch'
import { generatePNG } from './generate-png'
import { checkContribsPersistence, saveContribsPersistence } from './persistence'
import { generateContributorsSVGFile } from './svg-codegen'
import type { CliOptions } from './types'

async function main() {
  program
    .option('-t, --token <token>', 'Personal GitHub token')
    .option('-o, --owner <owner>', 'Repo owner name')
    .option('-r, --repo <repo>', 'GitHub repo path')
    .option('--tinypng <tinypng>', 'TinyPNG API key')
    .parse(process.argv)

  const options = program.opts()
  const { token, repo, owner, tinypng } = options as CliOptions
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
    const identifier = `${owner}/${repo}` as const;
    const contribUserNames = sortedContributors.map(([userName,]) => userName);
    checkContribsPersistence(
      contribUserNames,
      identifier
    )

    const svgString = generateContributorsSVGFile({
      imgWidth: 1000,
      blockSize: 120,
      lineCount: 8,
    }, sortedContributors)
    await generatePNG({
      identifier,
      tinyPNGAPIKey: tinypng,
      svgString,
    })
    saveContribsPersistence(
      contribUserNames,
      identifier
    )
  }
}  

main()
