# calendar-widget [![Actions Status](https://github.com/ccnmtl/calendar-widget/workflows/build-and-test/badge.svg)](https://github.com/ccnmtl/calendar-widget/actions)

## Make targets
* `make build`: Runs webpack to compile to the local directory
* `make dev`: Runs webpack-dev-server, serves page in a browser, auto-reloads
* `make stage`: Runs webpack, uses the staging url for resource links
* `make prod`: Runs webpack, uses the production url for resource links
* `make eslint`: Runs eslint
* `make test`: Runs eslint and mocha tests
* `make clean`: rm's node_modules
