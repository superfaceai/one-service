# One Service

## Install

To install this package just install the cli globally using:

```shell
npm install --global @superfaceai/one-service
```

## Usage

To run One Service you need to have Superface configuration.

1. Create new folder where the configuration will be created:

   ```shell
   mkdir myapp
   cd myapp
   ```

2. [Install usecases](https://superface.ai/docs/getting-started#install-the-capability) and [configure providers](https://superface.ai/docs/getting-started#configure-the-provider):

   ```shell
   npx @superfaceai/cli install weather/current-city -p wttr-in
   ```

   (Repeate for any usecase you find in [Catalog](https://superface.ai/catalog).)

3. Start one service with [GraphiQL](https://github.com/graphql/graphiql).

   ```shell
   oneservice --graphiql
   ```

## Example Queries

```graphql
query Example {
  _superJson {
    profiles {
      name
      version
      providers
    }
    providers
  }

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

query ExampleSelectProvider {
  VcsUserRepos {
    UserRepos(input: { user: "freaz" }, options: { provider: mock }) {
      result {
        repos {
          name
          description
        }
      }
    }
  }
}

query SuperJsonInfo {
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

### Develop

```shell
# Install dependencies
$ yarn install

# Build and run
$ yarn build
$ bin/cli

# Develop
$ yarn start:dev
$ yarn start:dev --graphiql

# See debug
$ DEBUG="oneservice*" yarn start:dev

# Run tests
$ yarn test

# Run tests with watch
$ yarn test --watch
```
