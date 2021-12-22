# One Service

```shell
# Install dependencies
$ npm install

# Develop
$ npm run start:dev

# See debug
$ DEBUG="oneservice*" npm run start:dev

# Run tests
$ npm test

# Run tests with watch
$ npm test -- --watch
```

Example Quries:

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
```
