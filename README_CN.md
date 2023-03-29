# make-github-contributor-svg

> 如果你发现自己看到的头像全是裂图，这是由于 Github 的 camo 缓存机制的原因，作者在开发过程中调试时在 Github 上曾经留下了错误的缓存记录，不影响你的正常使用。要删除缓存和重置，可以参考下面这个仓库的教程：
> 
> [hub-purge](https://github.com/mpyw/hub-purge)
> 
> ```bash
> # 安装 hub-purge
> (
>     cd /tmp \
>     && curl -LO https://raw.githubusercontent.com/mpyw/hub-purge/master/hub-purge.sh \
>      && chmod +x hub-purge.sh \
>     && mv hub-purge.sh /usr/local/bin/hub-purge
> )
> ```
> 
> 然后再使用 
> 
> ```bash
> hub-purge ShenQingchuan/github-contributor-svg-generator
> ```
> 
> 缓存需要打开 Chrome DevTools 在 [网络] Tab 页面中开启 “停用缓存”，可能需要反复刷新几次才可以冲掉。

[![npm](https://img.shields.io/npm/v/make-github-contributor-svg.svg)](https://npmjs.com/package/make-github-contributor-svg)

根据 Pull Request 及其相关用户的 Commit 数量制作贡献者 SVG 图

灵感来自 [Antfu's sponsorkit](https://github.com/antfu/sponsorkit)

## CLI 形式使用指南

```bash
# NPM
npm i --save-dev make-github-contributor-svg

# Yarn
yarn add -D make-github-contributor-svg

# PNPM
pnpm add -D make-github-contributor-svg
```

这个 NPM 包提供了一个可执行命令 **`gh-contrib-svg`**

你可以运行 **`gh-contrib-svg -h`** 来查看该命令的帮助信息：

```bash
使用方法: gh-contrib-svg [选项]

Options:
  -t, --token <token>  Github Token
  -o, --owner <owner>  仓库拥有者名称（用户名或组织名）
  -r, --repo <repo>    仓库名称
  -s, --size <size>    头像大小 (pixel) (default: "120")
  -w, --width <width>  输出图像宽度 (pixel) (default: "1000")
  -c, --count <count>  每行头像数量 (default: "8")
  -h, --help           显示帮助信息
```

使用下面的代码示例将会拉取对应仓库的相关信息。

贡献排行榜上只会显示创建过 Pull Request 的用户，并根据他们创建的 Commit 数量从高到底排序

**提示：** 这个命令执行完成后会在你项目的根目录创建一个 `.github-contributors` 文件夹来存放 SVG 文件。

```bash
gh-contrib-svg -t <你的 Github Token> -o vuejs-translations -r docs-zh-cn

# 你可以配置默认的token和owner, 简化命令
# 在.zshrc或.bashrc中添加以下代码
export $Github_token=你的GithubToken
export $Github_owner=仓库拥有者名称（用户名或组织名）

gh-contrib-svg -r <repo>

# 如果你是在项目的根目录下执行这个命令-r也可以省略, 默认读取当前目录下的package.json中的name
gh-contrib-svg
```

贡献排名是根据以下公式计算的：“用户成功合并的 Pull Request 数量 + 用户在当前仓库中提交的代码数量。”

## Github Actions 配置指南

您可以复制下面的 YAML 示例，并根据上述指南更改 `-o`、`-r` 参数。

```yaml
name: update-contributors-svg

on:
  workflow_dispatch: # 用于手动触发
  schedule:
    - cron: '0 7 * * *' # 每天 7:00 定时执行

jobs:
  update-svg:
    name: Update contributors SVG
    runs-on: ubuntu-latest # 你也可以设置 macos-latest
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

## 在 README 中展示 SVG

将下面的 HTML 代码示例添加到您的 README 中，记得替换 `<owner>`、`<repo>` 和 `<svg-file-name>` 这几个占位符。

```markdown
<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/.github-contributors/<svg-file-name>.svg">
    <img src="https://cdn.jsdelivr.net/gh/<owner>/<repo>@main/.github-contributors/<svg-file-name>.svg" />
  </a>
</p>
```

## 示例

这里是一个示例 SVG 图，图中展示的是 Vue.js 中文文档翻译贡献者。

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/ShenQingchuan/github-contributor-svg-generator@main/.github-contributors/vuejs-translations_docs-zh-cn.svg">
    <img src="https://cdn.jsdelivr.net/gh/ShenQingchuan/github-contributor-svg-generator@main/.github-contributors/vuejs-translations_docs-zh-cn.svg" />
  </a>
</p>
