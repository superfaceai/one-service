# One Service

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

### Example Queries

```graphql
query Example {
  VcsUserRepos {
    UserRepos(input: { user: "test" }) {
      result {
        repos {
          name
          description
        }
      }
    }
  }
  CrmContacts {
    Search(
      input: { property: "email", operator: EQ, value: "test@example.com" }
    ) {
      result {
        id
        email
      }
    }
  }
}

mutation Example2 {
  CommunicationSendEmail {
    SendEmail(
      input: {
        from: "test@example.com"
        to: "user@example.com"
        text: "Hello from Superface"
      }
    ) {
      result {
        messageId
      }
    }
  }
  LanguageTranslate {
    TranslateText(
      input: { text: "test", targetLanguage: BG, sourceLanguage: EN }
    ) {
      result {
        text
        sourceLanguage
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
