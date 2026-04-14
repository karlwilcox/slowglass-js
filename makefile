# Some simple tasks, that always run

SHELL := /bin/bash
.ONESHELL:

sg:	
	esbuild src/main.js --bundle --sourcemap --outfile=dist/slow-glass.js
# esbuild src/main.js --bundle --minify --sourcemap --outfile=dist/slow-glass.js
# copy the distribution js to the test server in case we only changed the code
	rsync --delete -e "ssh" -aP /Users/karlw/icloud/Projects/SlowGlass-js/dist/ karlw@192.168.1.10:/home/karlw/sites/karlwilcox/slow-glass/dist
	echo Only code updated, build and deploy if docs have changed

