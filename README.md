# One Service

### Configure

```shell
# Clone and build One Service (this step will be replaced by npm install or running npx)
$ git clone --branch feat/graphql_support git@github.com:superfaceai/one-service.git
$ cd one-service
$ npm install
$ npm run build
$ npm link

# Check One Service CLI is installed
$ oneservice --help

# Create home for Superface configuration alongside one-service
$ cd ..
$ mkdir myapp
$ cd myapp

# Configure profiles and providers
$ npx @superfaceai/cli install weather/current-city -p wttr-in

# Start One Service
$ oneservice --graphiql
```

### Example Queries

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
$ npm install

# Build and run
$ npm run build
$ bin/cli

# Develop
$ npm run start:dev
$ npm run start:dev -- --graphiql

# See debug
$ DEBUG="oneservice*" npm run start:dev

# Run tests
$ npm test

# Run tests with watch
$ npm test -- --watch
```
