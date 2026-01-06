# calendar-widget [![Actions Status](https://github.com/ccnmtl/calendar-widget/workflows/build-and-test/badge.svg)](https://github.com/ccnmtl/calendar-widget/actions)

## AI Filters
The main calendar widget has a conditional filter for AI events that triggers in specific URLs, see `src/js/main.js`. There is also a dedicated Upcoming Events that automatically filters AI events, `src/js/upcoming.js`. 

## Make targets
* `make build`: Runs webpack to compile to the local directory
* `make dev`: Runs webpack-dev-server, serves page in a browser, auto-reloads
* `make stage`: Runs webpack, uses the staging url for resource links
* `make prod`: Runs webpack, uses the production url for resource links
* `make eslint`: Runs eslint
* `make test`: Runs eslint and mocha tests
* `make clean`: rm's node_modules
