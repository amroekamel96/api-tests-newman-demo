# API Test Suite: Postman + Newman (Demo)

A small, readable API test suite showing how I structure automated API tests:
a **Postman collection** with scripted assertions, run from the command line
with **Newman**, with an **HTML report** and a **GitHub Actions** pipeline.

The suite targets the shape of the free public
[JSONPlaceholder](https://jsonplaceholder.typicode.com) practice API. This is a
demo, not client work.

## Two ways to run it

| Command | What it runs against | When to use |
| --- | --- | --- |
| `npm test` | A bundled local mock API (`mock/server.js`), started and stopped automatically | Default. Fast, deterministic, works offline and in CI |
| `npm run test:live` | The real JSONPlaceholder API | To confirm the suite also passes against the public service |

The mock reproduces the response shapes the tests rely on. Passing against the
mock proves the test logic works; passing in live mode proves the contract holds
against the real service. In CI the mock run gates the build and the live run is
informational (a public site can be slow or unreachable).

## What is covered

| Folder | Requests | What is checked |
| --- | --- | --- |
| Posts - Read | list, get one, filter by `userId`, nested comments | status code, JSON schema, unique ids, filter correctness, email format |
| Users | get one user | exact set of fields, nested `address.geo` and `company` structure |
| Posts - Write | create, replace (PUT), update (PATCH), delete | status codes (201 / 200), echoed data, partial update keeps other fields |
| Negative cases | missing post, invalid id, unknown route | 404 status and empty body |
| Data-driven POST | create post from a CSV file | one iteration per CSV row, response matches the row |

Two checks run automatically after **every** request (collection-level tests):

- response time is under the threshold (`maxResponseMs`, default 2000 ms)
- `Content-Type` is JSON

## Project structure

```
collections/    Postman collection (requests + test scripts)
environments/   Environment variables (baseUrl, postId, maxResponseMs)
data/posts.csv  Input rows for the data-driven run
mock/server.js  Dependency-free local mock of the API
scripts/run.js  Runner: starts the mock (or targets the live API) and runs Newman
reports/        HTML reports are written here (not committed)
.github/workflows/newman.yml   CI pipeline
```

## Getting started

Requirements: Node.js 18+ and npm.

```bash
npm install
npm test              # main suite against the local mock
npm run test:data     # data-driven run (one iteration per row in data/posts.csv)
npm run test:all      # both
npm run test:live     # main suite against the real API
npm run test:live:data
```

HTML reports are written to `reports/`, for example
`reports/newman-local-report.html`.

To explore the requests interactively, import the files in `collections/` and
`environments/` into Postman.

## Notes and limits

- JSONPlaceholder **fakes writes**: POST, PUT, PATCH and DELETE return realistic
  responses but nothing is stored. The write tests therefore check the response
  contract, not persistence.
- The API has no authentication, so this demo does not show token or permission
  testing. Those checks follow the same pattern: add an `Authorization` header
  from an environment variable and assert on 401 / 403 responses.
- The response-time threshold is configurable per environment.

## CI

`.github/workflows/newman.yml` installs dependencies, runs both suites against
the local mock (this gates the build), then runs them against the live API
without failing the build, and uploads the HTML reports as a build artifact.

## Tech stack

Postman collection v2.1, Newman, `newman-reporter-htmlextra`, Node.js,
GitHub Actions.
