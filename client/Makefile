all: all.js

all.js: ../bower_components/jquery/dist/jquery.js ../lib/px3.js ../lib/sigil/sigil.js styles.js main.js \
apps/daemon/all.js	\
apps/cell/all.js	\
apps/grid/all.js	\
apps/hello/all.js	\
apps/image/all.js	\
apps/window/all.js	\
apps/titlebar/all.js	\
apps/button/all.js	\
apps/list/all.js	\
apps/listener/all.js	\
apps/notebook/all.js	\
apps/terminal/all.js	\
apps/audioplayer/all.js	


	cat $^ > all.js

clean:
	rm -f *~ all.js
