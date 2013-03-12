MOCHA=node_modules/.bin/mocha
REPORTER=spec
test: 
	$(MOCHA) $(shell find test -name "*-test.js") --test --ignore-leaks --reporter $(REPORTER)
.PHONY: test