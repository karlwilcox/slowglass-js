# Some simple tasks, that always run

SHELL := /bin/bash
.ONESHELL:

sg:	
	esbuild src/main.js --bundle --sourcemap --outfile=js/slowglass.js
	bundle exec jekyll build
	rsync --delete -e ssh -aP /Users/karlw/Sites/slowglass/ karlw@192.168.1.10:/home/karlw/sites/slowglass

# esbuild src/main.js --bundle --minify --sourcemap --outfile=js/slowglass.js
# copy the distribution js to the test server in case we only changed the code
#	rsync --delete -e "ssh" -aP /Users/karlw/icloud/Projects/SlowGlass-js/dist/ karlw@192.168.1.10:/home/karlw/sites/karlwilcox/slow-glass/dist
#	rsync --delete -e "ssh" -aP /Users/karlw/icloud/Projects/SlowGlass-js/scripts/ karlw@192.168.1.10:/home/karlw/sites/karlwilcox/scripts
#	rsync --delete -e "ssh" -aP /Users/karlw/icloud/Projects/SlowGlass-js/assets/ karlw@192.168.1.10:/home/karlw/sites/karlwilcox/assets
#	echo Only code updated, build and deploy if docs have changed

