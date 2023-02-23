[Website](https://superface.ai) | [Get Started](https://superface.ai/docs/getting-started) | [Documentation](https://superface.ai/docs) | [Discord](https://sfc.is/discord) | [Twitter](https://twitter.com/superfaceai) | [Support](https://superface.ai/support)

<img src="https://github.com/superfaceai/one-service/raw/main/docs/LogoGreen.png" alt="Superface" width="100" height="100">

# OneService

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/superfaceai/one-service/main.yml?branch=main)](https://github.com/superfaceai/one-service/actions/workflows/main.yml)
[![npm](https://img.shields.io/npm/v/@superfaceai/one-service)](https://www.npmjs.com/package/@superfaceai/one-service)
[![license](https://img.shields.io/npm/l/@superfaceai/one-service)](LICENSE)
![TypeScript](https://img.shields.io/static/v1?message=TypeScript&&logoColor=ffffff&color=007acc&labelColor=5c5c5c&label=built%20with)
[![Discord](https://img.shields.io/discord/819563244418105354?logo=discord&logoColor=fff)](https://sfc.is/discord)

OneService allows you to run [OneSDK](https://github.com/superfaceai/one-sdk-js) as a service with configured usecases. And use it as [backend for frontend](https://samnewman.io/patterns/architectural/bff/).

For more details about Superface visit [how it works](https://superface.ai/how-it-works) and [get started](https://superface.ai/docs/getting-started).

## Install

You can use this package as a globally installed CLI program:

```shell
npm install --global @superfaceai/one-service
```

## Usage

To run OneService you need to have Superface configuration.

1. Create new folder where the configuration will be created:

   ```shell
   mkdir myapp
   cd myapp
   ```

2. [Install usecases](https://superface.ai/docs/getting-started#install-the-capability) and [configure providers](https://superface.ai/docs/getting-started#configure-the-provider) <a name="usage-install-profiles"></a>:

   ```shell
   npx @superfaceai/cli install weather/current-city --providers wttr-in
   ```

   (Repeat for any usecase you find in [Catalog](https://superface.ai/catalog).)

3. Start OneService with [GraphiQL](https://github.com/graphql/graphiql).

   ```shell
   oneservice --graphiql
   ```

4. Visit http://localhost:8000/ to open GraphQL interactive IDE

### Use as a HTTP server middleware

OneService package provides `createGraphQLMiddleware` function for mounting the GraphQL server as a middleware with any HTTP web framework that supports connect styled middleware. This includes [Connect](https://github.com/senchalabs/connect) itself, [Express](https://expressjs.com/), [Polka](https://github.com/lukeed/polka), [Restify](http://restify.com/) and others.

The `createGraphQLMiddleware` function returns a promise, therefore you need to await resolution before mounting the middelware.

If you can use [ES modules](https://nodejs.org/api/esm.html) in your project, you can resolve the promise with top-level `await`:

```js
// server.mjs
import express from 'express';
import { createGraphQLMiddleware } from '@superfaceai/one-service';

const app = express();
const graphqlMiddleware = await createGraphQLMiddleware({
  graphiql: true,
});

app.use('/graphql', graphqlMiddleware);

app.listen(3000);
```

Alternatively you can setup the server inside an `async` funtion:

```js
const express = require('express');
const { createGraphQLMiddleware } = require('@superfaceai/one-service');

async function startServer() {
  const app = express();
  const graphqlMiddleware = await createGraphQLMiddleware({
    graphiql: true,
  });
  app.use('/graphql', graphqlMiddleware);

  app.listen(3000);
}

startServer();
```

`createGraphQLMiddleware` function will throw an error if it cannot generate a GraphQL schema. Possible issues include:

- missing or invalid `super.json`
- name collision between use-cases of installed profiles
- profile with features unsupported by GraphQL

## Example Queries

```graphql
query WeatherInPrague {
  WeatherCurrentCity {
    GetCurrentWeatherInCity(input: { city: "Prague" }) {
      result {
        temperature
        feelsLike
        description
      }
    }
  }
}

query SelectProvider {
  WeatherCurrentCity {
    GetCurrentWeatherInCity(
      input: { city: "Prague" }
      options: { provider: mock }
    ) {
      result {
        temperature
        feelsLike
        description
      }
    }
  }
}

query InstalledProfilesAndProviders {
  _superJson {
    profiles {
      name
      version
      providers
    }
    providers
  }
}
```

### Use with `.env` file

OneService doesn't automatically load `.env` file. You can manually use [dotenv package](https://github.com/motdotla/dotenv) for this functionality. If you would like to use OneService CLI with dotenv, follow these steps:

1. Install dotenv and OneService locally in your project:

   ```
   npm i dotenv @superfaceai/one-service
   ```

2. Run the CLI via `node` with [dotenv preload](https://github.com/motdotla/dotenv#preload):

   ```
   node -r dotenv/config node_modules/.bin/oneservice
   ```

## Deployment

### Considerations

OneService doesn't provide any authentication or CORS support.
This should be handled by API Gateway (eg. [Express Gateway](https://github.com/ExpressGateway/express-gateway) or [Kong](https://github.com/kong/kong)) or you can use own Express instance and [attach the middleware](#use-as-http-server-middleware).

### Heroku

OneService can be deployed to [Heroku with Git](https://devcenter.heroku.com/articles/git).

#### Prerequisites

- [Heroku CLI installation instructions](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)
- [Git installation instructions](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js installation instructions](https://nodejs.dev/learn/how-to-install-nodejs)

#### Steps

1. You will need folder for the application with local Git repository

   ```shell
   mkdir myapp
   cd myapp
   git init
   ```

2. Next step is to install OneService

   ```shell
   npm init -y
   npm install --save @superfaceai/one-service
   ```

3. Install profiles as explaied in [Usage step 2](#usage-install-profiles).

4. [Create Heroku Procfile](https://devcenter.heroku.com/articles/procfile)

   ```shell
   echo 'web: oneservice --port $PORT --host 0.0.0.0 --graphiql' > Procfile
   ```

5. Commit changes to Git repository

   ```shell
   git add --all
   git commit -m 'OneService configuration'
   ```

6. Create Heroku remote

   ```shell
   heroku create
   ```

7. Deploy app

   ```shell
   git push heroku main
   ```

## Contributing

We welcome all kinds of contributions! Please see the [Contribution Guide](CONTRIBUTING.md) to learn how to participate.

## License

OneService is licensed under the [MIT License](LICENSE).

© 2023 Superface s.r.o.

<!-- TODO: allcontributors -->
