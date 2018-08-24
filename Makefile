# See README for explanation of Make targets
NODE_MODULES ?= ./node_modules
JS_SENTINAL ?= $(NODE_MODULES)/sentinal

$(JS_SENTINAL): package.json
	rm -rf $(NODE_MODULES) dist
	npm install
	touch $(JS_SENTINAL)

build: $(JS_SENTINAL)
	npm run build	

dev: $(JS_SENTINAL)
	npm run dev 

stage: $(JS_SENTINAL)
	npm run stage 

prod: $(JS_SENTINAL)
	npm run prod 

eslint: $(JS_SENTINAL)
	npm run eslint

test: $(JS_SENTINAL) eslint
	npm run test

clean:
	rm -rf $(NODE_MODULES) dist

.PHONY: clean
