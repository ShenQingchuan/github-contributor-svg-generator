import path from 'path'

export function getDefaultValue(name: string) {
  return process.env[name]
}

export async function getRepoName() {
  try {
    const { repository, name } = await import(path.resolve(process.cwd(), './package.json'))

    if (!repository)
      return name
    const url = repository?.url ?? repository
    // "git + git@github.com:xx/xx.git"
    // "https://github.com/tj/commander.js.git"
    const match = url.match(/github.com[:\/]?[\w\-_]+\/([\w\-_]+)/)

    if (match) {
      return match[1]
    }
  } catch (e) {

  }
}
