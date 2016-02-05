all: all.js

all.js: ../bower_components/jquery/dist/jquery.js ../lib/px3.js styles.js main.js apps/hello/all.js apps/window/all.js apps/titlebar/all.js
	cat $^ > all.js

clean:
	rm -f *~ all.js
