TESTS = $(shell find test/ -name '*.test.js')

test:
	@NODE_ENV=test ./node_modules/should/support/expresso/bin/expresso $(TESTS)

.PHONY: test