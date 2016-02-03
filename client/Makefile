all: all.js

all.js: ../bower_components/jquery/dist/jquery.js ../lib/px2.js main.js apps/hello/all.js
	cat $^ > all.js

clean:
	rm -f *~ all.js
