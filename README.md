# github-contributor-svg-generator

Generate all contributors by counting PRs and commits.


## Drawbacks

You may compare this project to [Antfu's sponsorkit](https://github.com/antfu/sponsorkit)...

Why did I choose this way to generate images? Why didn't I implement the function that allows clicking on avatars in the image to redirect to corresponding user profiles?

1. I want this project to be relatively independent and simple, without relying on paid services such as CDN. It can be achieved with just Github.
2. I need to control the file size of the images to avoid exceeding Github's limit on the deployment repository's Git update records.

## Demo

Here is a demo for Vuejs Chinese documentation translation contributors.

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/ShenQingchuan/github-contributor-svg-generator@main/dist/vuejs-translations/docs-zh-cn.png" />
</p>
