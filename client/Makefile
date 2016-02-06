all: all.js

all.js: ../bower_components/jquery/dist/jquery.js ../lib/px3.js ../lib/sigil.js styles.js main.js \
apps/daemon/all.js	\
apps/grid/all.js	\
apps/hello/all.js	\
apps/window/all.js	\
apps/titlebar/all.js	\
apps/list/all.js	\
apps/listener/all.js	\
apps/notebook/all.js
	cat $^ > all.js

clean:
	rm -f *~ all.js
