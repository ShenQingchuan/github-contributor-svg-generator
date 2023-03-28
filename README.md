# make-github-contributor-svg

[中文文档](./README_CN.md)

[![npm](https://img.shields.io/npm/v/make-github-contributor-svg.svg)](https://npmjs.com/package/make-github-contributor-svg)

Generate all contributors by counting PRs and commits. 

Inspired by [Antfu's sponsorkit](https://github.com/antfu/sponsorkit)

## Guide for CLI usage

```bash
# NPM
npm i --save-dev make-github-contributor-svg

# Yarn
yarn add -D make-github-contributor-svg

# PNPM
pnpm add -D make-github-contributor-svg
```

This package provide a excutable command **`gh-contrib-svg`**

You can run **`gh-contrib-svg -h`** to display help for command:

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

Using the command examples provided below will fetch repository-related information.

The contribution leaderboard will only display users who have created Pull Requests, and they will be ranked in descending order based on the number of Commits they have created.

**Info:** After this command finished, a `.github-contributors` folder would be created, in order to store SVG files in your project's root directory.

```bash
gh-contrib-svg -t <Your Github Token> -o vuejs-translations -r docs-zh-cn
```

The contribution ranking is calculated based on the following formula: "The user's successfully merged Pull Requests + the number of commits made by the user in the current repository."

## Guide for Github Actions

You can copy the yaml example below and change the `-o`, `-r` arguments by following the guide above.

```yaml
name: update-contributors-svg

on:
  workflow_dispatch: # Can trigger manually
  schedule:
    - cron: '0 7 * * *' # Schedule on everyday 7:00

jobs:
  update-svg:
    name: Update contributors SVG
    runs-on: ubuntu-latest # You can also try macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set node
        uses: actions/setup-node@v3
        with:
          node-version: lts/*

      - name: Install pnpm
        uses: pnpm/action-setup@v2.2.2
        with:
          version: 7
      
      - name: Install deps
        run: pnpm install

      - name: Run SVG generation script
        run: pnpx make-github-contributor-svg -t ${{ secrets.GITHUB_TOKEN }} -o vuejs-translations -r docs-zh-cn

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
