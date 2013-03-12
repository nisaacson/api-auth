Use couch-profiles to perform basic auth in express apps

# Tests
First install all the dev dependencies with `npm install` and then execute
```bash
npm test
```
To run the tests you may need to first create the db and needed views. You can easily do this using the couchdb-update-views module. First navigate to the root directory of this module and execute
```bash
[sudo] npm install -g couchdb-update-views
couchdb-update-views --docsDir node_modules/couch-profile/docs --config test/config.json`
```
