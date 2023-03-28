# make-github-contributor-svg

Generate all contributors by counting PRs and commits. 

Inspired by [Antfu's sponsorkit](https://github.com/antfu/sponsorkit)

## Install

```bash
# NPM
npm i --save-dev make-github-contributor-svg

# Yarn
yarn add -D make-github-contributor-svg

# PNPM
pnpm add -D make-github-contributor-svg
```

## Guide

You can run `` to display help for command:

```bash
Usage: gh-contrib-svg [options]

Options:
  -t, --token <token>  Personal GitHub token
  -o, --owner <owner>  Repo owner name
  -r, --repo <repo>    GitHub repo path
  -s, --size <size>    Single avatar block size (pixel) (default: "120")
  -w, --width <width>  Output image width (pixel) (default: "1000")
  -c, --count <count>  Avatar count in one line (default: "8")
  -h, --help           display help for command
```

Using the command examples provided below will retrieve repository-related information, with contribution benchmarks being users on Github who have initiated a Pull Request.

**Info:** This command would create a `.github-contributors` folder to store SVG files in your project's root directory.

```bash
gh-contrib-svg -t <Your Github Token> -o vuejs-translations -r docs-zh-cn
```

The contribution ranking is calculated based on the following formula: "The user's successfully merged Pull Requests + the number of commits made by the user in the current repository."

## Github Actions

You can copy the yaml example below and change some

```yaml
name: update-contributors-svg

on:
  # Schedule the interval of the checks.
  schedule:
    - cron: '0 7 * * *' # Everyday 7:00

jobs:
  update-svg:
    name: Update contributors SVG
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set node
        uses: actions/setup-node@v3
        with:
          node-version: lts/*

      - run: npx pnpm i

      - name: Run SVG generation script
        run: npx make-github-contributor-svg -t ${{ secrets.GITHUB_TOKEN }} -o vuejs-translations -r docs-zh-cn

      - name: Commit
        uses: EndBug/add-and-commit@v4
        with:
          message: "chore(workflow): update contributors image"
          add: ".github-contributors/*"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Show SVG in README

Add the HTML code sample below to your README after replace the `<owner>`, `repo` and `<svg-file-name>` placeholders.

```markdown
<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/.github-contributors/<svg-file-name>.svg">
    <img src="https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/.github-contributors/<svg-file-name>.svg" />
  </a>
</p>
```

## Demo

Here is a demo for Vuejs Chinese documentation translation contributors.

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/ShenQingchuan/github-contributor-svg-generator@main/.github-contributors/vuejs-translations_docs-zh-cn.svg">
    <img src="https://cdn.jsdelivr.net/gh/ShenQingchuan/github-contributor-svg-generator@main/.github-contributors/vuejs-translations_docs-zh-cn.svg" />
  </a>
</p>
