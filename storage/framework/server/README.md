# Please Note

Copy the root .env into this directory.

## Server

This directory is used to store files to build the Docker image for the server.

## Notes

We use a custom `tsconfig.json` file to ensure that the aliases point to the correct paths within the Docker image.

### TODO

- [ ] Don't include `node_modules` in the Docker image, but bundle it using Bun
- [ ] Ensure to use workspaces in the `package.json` file
- [ ] No need for ./Actions because ./app/Actions
