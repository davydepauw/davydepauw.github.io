# davydepauw.github.io

A terminal-style index of my public projects, in the [Nara](https://github.com/davydepauw/nara-vscode) palette.

## Publish

This is a static site. GitHub Pages can serve it with no build step.

1. Create a repository named `davydepauw.github.io`.
2. Push this folder to `main`.
3. In the repository settings, set Pages to deploy from the `main` branch, folder `/` (root).

The site will be at <https://davydepauw.github.io>.

`.nojekyll` is here so Pages serves the files as-is.

## Lists

Personal links and projects are JSON arrays at the bottom of `index.html` (`links-data` and `projects-data`). Add an object to either array. Projects are numbered in that order.
