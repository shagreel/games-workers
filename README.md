## Template: worker-router

This template demonstrates using the [`itty-router`](https://github.com/kwhitley/itty-router) package to add routing to your Cloudflare Workers.

[`index.js`](https://github.com/cloudflare/worker-template-router/blob/master/index.js) is the content of the Workers script.

## Deploy

Before publishing your code you need to edit `wrangler.toml` file and add your Cloudflare `account_id` - more information about configuring and publishing your code can be found [in the documentation](https://developers.cloudflare.com/workers/learning/getting-started).

Once you are ready, you can publish your code by running the following command:

```sh
$ npx wrangler login
# then
$ npx wrangler publish
# or
$ npx wrangler publish --env stage
```
