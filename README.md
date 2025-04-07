# release

**Release**, a powerful tool designed to streamline your Git release process. With a set of intuitive
commands, Release CLI helps you manage tags, generate changelogs, and increment versions effortlessly. Whether you're a developer or a project manager, this tool is crafted to enhance your workflow with Git repositories.

## Requirements

Before you start to use this CLI, check if you have `git` and [GitHub cli](https://cli.github.com/).

## Features

### 1. Get latest tag based on creation date

Retrieve the most recent tag in your repository, sorted by creation date. This command helps you quickly identify the latest release point.

```bash
release tag
```

### 2. Write a Changelog based on previous version

Automatically generate a changelog by comparing the two most recent tags. This feature is perfect for documenting
changes and updates between releases.

```bash
release changelog
```

- `--changelog | -c`: set the path of changelog file
- `--publish | -P`: publish the release using GitHub CLI

### 3. Increment the current tag version based on semver

Easily increment your current tag version following semantic versioning (Semver) principles. This command ensures your
versioning is consistent and meaningful.

```bash
release semver 0.1.0 --increment major # will increment to 1.0.0
```

- `--increment | -i`: increment semver tag using the parameters "major", "minor", "patch", "pre", "premajor", "preminor", "prepatch", "prerelease". If `--increment` is omitted, this CLI will show all increment types for the next tag.

### 4. Create a new tag based on git date version

Create a new tag using the Git date versioning scheme. This command is useful for timestamp-based versioning
strategies.

```bash
release gitdate
```

## Usage

Once installed, you can use the release command followed by any of the subcommands mentioned above to perform the
desired action. Make sure you are in the root directory of your Git repository when executing these commands. If not,
you can pass the `--cwd` or `-p` argument with the directory that you need to execute the script:

```bash
release changelog --cwd $HOME/my-awesome-project
```

## Contributing

We welcome contributions to enhance the Release CLI. Feel free to fork the repository, make changes, and submit a
pull request. Please ensure your code follows the project's coding standards and includes relevant tests.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

