https://github.com/people-eat

# PeopleEat Server

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/2805a2173f4d437283cd3147df3087ba)](https://app.codacy.com/gh/people-eat/server/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

## Development Prerequisites

-   Make sure you have the [Node.js runtime](https://nodejs.org) installed.
-   Make sure you are using Node.js version 20. A simple way to switch versions is with the npm package [n](https://www.npmjs.com/package/n) or [nvm](https://github.com/nvm-sh/nvm).

```bash
npm install --global n
```

```bash
sudo n 20
```

-   Make sure you have the [Yarn package manager](https://yarnpkg.com) installed.

```bash
npm install --global yarn
```

## Development

npm run generate:graphql
npm run build:host-local

git config --global core.autocrlf false
npm run lint:check --fix

yarn set version stable
yarn install

Install dependencies:

```bash
yarn
```

npx diagnose-endpoint@1.1.0 --endpoint="http://localhost:4000/graphql"

[http://localhost:4000/graphql](http://localhost:4000)

## Integration

[https://api-integration-people-eat.cem-yilmaz.de/graphql](https://api-integration-people-eat.cem-yilmaz.de/graphql)

## Production

[https://api-people-eat.cem-yilmaz.de/graphql](https://api-people-eat.cem-yilmaz.de/graphql)

## Technology Stack

-   [TypeScript](https://www.typescriptlang.org)

function execute(args) {

    const a= args.contextValue.body.query;
    if (args.contextValue.body.operationName !== 'IntrospectionQuery') {
        console.log(a);
    }
