#!/usr/local/bin/node

var readline = require('readline-sync');
var Sigil = require('./sigil.js');

var lisp = new Sigil({});

while(true) {
    try {
	var expr = readline.question("> ");
	console.log(lisp.exec(expr));
    } catch(e) { console.error(e); }
    
}

