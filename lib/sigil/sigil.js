var Sigil = new Model({
    type: "Lisp",
    init: function (options) {
        options = options || {};
        
        this.reset();
        
        options.core && this.loadCore(options.core);
    },
    
    reset: function (env, fenv) {
        var _fenv = {
            'atom': this.batom.bind(this),
            'null': this.bnull.bind(this),
            'set': this.bset.bind(this),
            'car': this.bcar.bind(this),
            'cdr': this.bcdr.bind(this),
            'eq': this.beq.bind(this),
            'cons': this.bcons.bind(this),
            '+': this.bplus.bind(this),
            '-': this.bminus.bind(this),
            '*': this.btimes.bind(this),
            '/': this.bdivide.bind(this),
            '%': this.bmod.bind(this),
            'apply': this.bapply.bind(this),
            'eval': this.beval.bind(this),
            'call': this.bcall.bind(this),
            'env': this.benv.bind(this),
            'fenv': this.bfenv.bind(this),
            'rm': this.brm.bind(this),
            'rmf': this.brmf.bind(this),
            '=>': this.bmagic.bind(this),
        };
        
        var _env = {
            't': 't'
        }; 


        env = $.extend(_env, env);
        fenv = $.extend(_fenv, fenv);
        console.log(_env, _fenv, env, fenv);
        this.env = env;
        this.fenv = fenv;
    },

    bmagic: function (args) {
        var retval = eval(args[0]);
        if(retval !== undefined)
            return retval;
        else
            return "";
    },

    brm: function (args) {
        var ret = this.env[args[0]];
        delete this.env[args[0]];
        return ret;
    },

    brmf: function (args) {
        var ret = this.fenv[args[0]];
        delete this.fenv[args[0]];
        return ret;
    },

    

    _null: function(e) {
        //return (e === undefined || (Array.isArray(e) && e.length === 0)) && 't' || [];
        return (Array.isArray(e) && e.length === 0) && 't' || [];
    },

    each: function(l, f) {
        if(this._null(l) !== 't') {
            if(l.length === 3) {
                f(l[0], true);
                this.each(l.slice(1), f);
            } else {
                f(l[0]);
                this.each(this.cdr(l), f);
            }
        } else {
            f(l, true);
        }
    },

    beq: function(args) {
        var x = args[0];
        var y = args[1][0];
        return (x === y || (Array.isArray(x) && Array.isArray(y) &&
                            x.length === 0 && y.length === 0)) && 't' || [];
    },

    bcond: function(args) {
        while(this._null(args) !== 't') {
            var test = args[0][0];
            var body = args[0][1];
            var result = this.eval(test);
            
            this.debug && console.log('sigil: bcond: test, body, result: ', test, body, result);
            if(this._null(result) !== 't') {
                return this.progn(body);
            }
            args = args[1];
        }
        return [];
    },
    
    bnull: function(args) {
        return this._null(args[0]);
    },

    atom: function (e) {
        return (typeof e === 'string' ||
                typeof e === 'number' ||
                this._null(e) === 't') && 't' || []
    },
    
    batom: function(args) {
        return this.atom(args[0]);
    },
    
    bdivide: function(args) {
        var quotient = args[0];
        
        this.each(args[1], function (e, last) {
            if(this._null(e) !== 't') {
                quotient /= e;
            }
        }.bind(this));
        
        return quotient;
    },

    bmod: function(args) {
        var x = args[0];
        var y = args[1][0];

        return Math.floor(x) % Math.floor(y);
    },

    btimes: function(args) {
        var product = args[0];
        
        this.each(args[1], function (e, last) {
            if(this._null(e) !== 't') {
                product *= e;
            }
        }.bind(this));
        
        return product;
    },

    bminus: function(args) {
        var difference = args[0];
        
        this.each(args[1], function (e, last) {
            if(this._null(e) !== 't') {
                difference -= e;
            }
        }.bind(this));
        
        return difference;
    },
    
    bplus: function(args) {
        var sum = args[0];
        
        this.each(args[1], function (e, last) {
            if(this._null(e) !== 't') {
                sum += e;
            }
        }.bind(this));
        
        return sum;
    },

    car: function (x) {
        var isnotnull = this._null(x) !== 't';
        if(this.atom(x) === 't' && isnotnull) {
            throw new Error("attempt to take the car of a symbol or number");
        } else {
            if(!isnotnull) {
                return [];
            } else {
                return x[0];
            }
        }
    },

    bcar: function (args) {
        return this.car(args[0]);
    },

    cdr: function (x) {
        var isnotnull = this._null(x) !== 't';
        if(this.atom(x) === 't' && isnotnull) {
            throw new Error("attempt to take the cdr of a symbol or number");
        } else {
            if(!isnotnull) {
                return [];
            } else {
                return x[1];
            }
        }
    },

    bcdr: function (args) {
        return this.cdr(args[0]);
    },

    cons: function(x, y) {
        return [x, y];
    },
    
    bcons: function (args) {
        var car = args[0];
        var cdr = args[1][0];
        return [car, cdr];
    },

    bprogn: function (args) {
        return this.progn(args);
    },
    
    progn: function (args) {
        var result;
        while(args.length > 0) {
            result = this.eval(args[0]);
            args = args[1];
        }
        
        return result;
    },

    evlambda: function (fun, args) {
        var vars = fun[1][0];
        var saved = {}
        
        // save variables
        var flag;
        this.each(vars, function (e, last) {
            if(!last) {
                if(!flag) {
	            if(e !== '&rest' && e !== '&body' && this.env[e] !== undefined) {
	                saved[e] = this.env[e];
	            }
	            if(!Array.isArray(args[0]) && args[0] && args[0].values !== undefined) {
	                this.env[e] = args[0].values[0];
	            } else {
	                if(e === '&rest' || e === '&body') {
                            flag = true;
                            return;
	                } else
                            saved[e] = this.env[e];
		            this.env[e] = args[0];
	            }
                    args = args[1];
                } else {
                    saved[e] = this.env[e];
		    this.env[e] = args;
                }
            }
        }.bind(this));

        var oldSelf = this.fenv['self'];
        this.fenv['self'] = fun;
        
        var result = this.progn(fun[1][1]);
        
        this.each(vars, function (e, last) {
            if(!last) {
	        if(saved[e] !== undefined) {
	            this.env[e] = saved[e];
	        } else {
                    delete this.env[e];
                }
            }
        }.bind(this));
        delete this.fenv['self']
        this.fenv['self'] = oldSelf;
        
        return result;
    },

    reverse: function(l) {
        var result = [];
        this.each(l, function (e, last) {
            if(last) {
                if(this._null(e) !== 't') {
                    if(this._null(result) !== 't') {
                        var result2 = result;
                        while(this._null(result2[1]) !== 't')
                            result2 = result2[1];
                        result2[1] = e;
                    } else {
                        result = e;
                    }
                }
            } else {
                result = [e, result];
            }
        }.bind(this));
        return result;
    },

    evlis: function(l) {
        var result = []
        this.each(l, function (x, last) {
            if(!last) {
	        var tmp = this.eval(x);
	        if(!Array.isArray(tmp) && tmp !== undefined && tmp.values !== undefined) {
	            tmp = tmp.values[0];
	        }
	        result = [tmp, result]
            }
        }.bind(this));
        return this.reverse(result);
    },

    beval: function(args) {
        var expr = args[0];
        return this.eval(expr);
    },

    bapply: function(args) {
        var fun = args[0];
        var args = args[1][0];
        return this.apply(fun, args);
    },
    
    apply: function(fun, args) {
        if(typeof fun === "string") {
	    var f = this.fenv[fun];
            /* This allows removal of funcall.  If function is not found
             * in the function environment, it is then looked up in the
             * normal environment.  Might reduce confusion for new
             * users? */
            if(f === undefined) {
                f = this.env[fun];
            }
            if(f)
                fun = f;
        } 
        
        if(Array.isArray(fun) && fun[0] === 'macro') {
            var x = this.evlambda(fun, args);
	    return this.eval(x);
        } else {
	    var args = this.evlis(args);
	    if(typeof fun === "function") {
	        return fun(args);
	    } else if(Array.isArray(fun) && fun[0] === 'lambda') {
                return this.evlambda(fun, args);
	    } else {
                throw new Error("undefined function: " + fun);
                return fun;
	    }
        }
        
        throw new Error("apply: " + fun + ": " + args);
    },

    bme: function(args) {
        var fun = args[0][0];
        var args = args[0][1];
        
        return this.evlambda(this.fenv[fun], args);
    },

    bset: function(args) {
        var v = args[0];
        var expr = args[1][0];
        
        if(typeof v === "string") {
	    return this.env[v] = expr;
        } else
	    throw new Error("attempt to set non-symbol value: " + v);
    },

    benv: function () {
        var retval = [];
        for(i in this.env) {
            retval = this.cons(this.cons(i, this.env[i]), retval);
        }
        return this.reverse(retval);
    },

    bfenv: function () {
        var retval = [];
        for(i in this.fenv) {
            retval = this.cons(this.cons(i, this.fenv[i]), retval);
        }
        return this.reverse(retval);
    },

    bprint: function(args) {
        var expr = args;
        if(!Array.isArray(expr) && expr != undefined && expr.values !== undefined) {
            this.each(expr.values, function (e, last) {
                if(!last)
	            console.log(e);
	    }.bind(this));
        } else {
	    console.log(expr);
        }
    },

    /* xxx
    bsetf: function(args) {
        var type = args[0][0]
        var value = this.eval(args[1][0]);
        
        switch(type) {
        case 'symbol-function': {
            var place = args[0][1][0];
	    return this.fenv[place] = value;
        }
        default: {
            var place = args[0];
            return this.env[place[0]] = value;
        }
        }
    }, */

/* TODO: decide if want to remove */
    bcall: function(args) {
        var fun = args[0];
        var args = args[1];
        
        if(typeof fun === 'string')
            fun = this.env[fun];
        
        return this.apply(fun, args);
    },

    bvalues: function(args) {
        return { 'values': args };
    },
    
    bbind: function(exprs) {
        var args = exprs[0];
        var values = this.eval(exprs[1][0]);
        var body = exprs[1][1];
        
        return this.apply(this.blambda([args, body]), values.values);
    },

    bdefmacro: function(expr) {
        var name = expr[0];
        var args = expr[1][0];
        var body = expr[1][1];
        
        var macro = [ 'macro', [ args, body ]];
        return this.fenv[name] = macro;
    },

    blambda: function (expr) {
        var args = expr[0];
        var body = expr[1];
        var lambda = [ 'lambda', [ args, body, []]];
        return lambda;
    },

    /* FUCK THIS IS HAIRY */
    bqquote: function(arg) {
        var result = [], dotted = false;
        if(Array.isArray(arg) && (arg[0] !== 'unquote' && arg[0] !== 'unquote-splice')) {
            this.each(arg, function(e, last) {
	        if(Array.isArray(e) && e[0] === 'unquote') {
	            result = [this.eval(e[1][0]), result];
	        } else if(Array.isArray(e) && e[0] === 'unquote-splice') {
                    var e2 = this.reverse(this.eval(e[1][0]));
                    var e3 = e2;
                    while(this._null(e3[1]) !== 't')
                        e3 = e3[1];
                    e3[1] = result;
                    result = e2;
	        } else if(e && Array.isArray(e) && e.length) {
	            result = [this.bqquote(e), result];
	        } else {
                    if(last && this._null(e) !== 't') {
                        if(result.length) {
                            var result2 = result;
                            while(this._null(result2[1]) !== 't')
                                result2 = result2[1];
                            result2[1] = e;
                        } else 
                            result = e;
                        dotted = true;
                    } else {
                        result = [e, result];
                    }
                }
            }.bind(this));
            
            
            if(this._null(result[0]) === 't' && dotted) {
                return result[1];
            } else if (this._null(result[0]) === 't') {
                return this.reverse(result[1]);
            }  else
                return result;
        } else if(arg[0] === 'unquote') {
            return this.eval(arg[1][0]);
        } else if(arg[0] === 'unquote-splice') {
            return this.eval(arg[1][0]);
        } else
            return arg;
    },

    eval: function(expr) {
        if(Array.isArray(expr)) {
            if(expr.length === 0) {
                return []; // nil
            }
	    var car = expr[0];
	    var cdr = expr[1];
	    switch(car) {
	    case 'qquote':
	        return this.bqquote(cdr[0]);
	    case 'cond':
	        return this.bcond(cdr);
	    case 'lambda':
	        return this.blambda(cdr);
	    /* case 'setf':  xxx
	        return this.bsetf(cdr); */
	    case 'values':
	        return this.bvalues(cdr);
	    case 'bind':
	        return this.bbind(cdr);
	    /* case 'symbol-function': xxx
	        return this.fenv[this.eval(cdr[0])]; */
	    case 'defmacro':
	        return this.bdefmacro(cdr);
            case 'progn':
                return this.bprogn(cdr);
            case 'me':
                return this.bme(cdr);
	    default:
	        return this.apply(car, cdr);
	    }
        } else if(typeof expr === "number") {
            return expr;
        } else if(typeof expr === "string") {
            var v = this.env[expr];
            if(v === undefined)
                v = this.fenv[expr]
	    if(v === undefined) {
	        throw new Error("undefined symbol or function: " + expr);
	    }
	    return v;
        } else {
	    return expr;
        }
        
        throw new Error("eval error:" + expr);
    },

    readFromString: function(string) {
        if(!string.length) return;
        function terminator(c) {
	    return c === undefined ||
	        c === ' ' ||
	        c === '\n' ||
	        c === '\r' ||
	        c === '(' ||
	        c === ')';
        }

        function isNumberThing(c,i, l) {
            return c === '0' ||
	        c === '1' ||
	        c === '2' ||
	        c === '3' ||
	        c === '4' ||
	        c === '5' ||
	        c === '6' ||
	        c === '7' ||
	        c === '8' ||
	        c === '9' ||
	        (c === '-' && i === 0 && l > 1) ||
	        (c === '+' && i === 0 && l > 1) ||
	        c === '.'
        }

        function readBar (string) {
            var symbol = "";

            while(string[0] !== '|') {
                symbol += string[0];
                string.shift();
            }
            string.shift();
            return symbol;
        }

        function readThing (string) {
	    var number = "";
	    var isNumber = true;
            var i = 0;
	    while(!terminator(string[0])) {
	        isNumber &= isNumberThing(string[0], i);
	        number += string[0];
	        string.shift();
                i++;
	    }
            if(number[0] === '+' ||
               number[0] === '-' &&
               number.length === 1) {
                isNumber = false;
            }

	    if(isNumber)
	        return parseFloat(number);
	    else
	        return number;
        }

        var inBackquote = false;

        function readSexpr(string) {
	    while(string[0] != undefined) {
	        var c = string.shift();
	        switch(c) {
	        case ' ':
	        case '\n':
	        case '\t':
		    continue;

                case ';': {
                    var c;
                    do {
                        c = string.shift();
                    } while(c && (c !== '\r' && c !== '\n'));
                    continue;
                }

	        case '`':
                    inBackquote = true;
                    var e = readSexpr.call(this, string);
		    var retval = [ 'qquote', [ e, []]];
                    inBackquote = false;
                    return retval;
                    
	        case ',':
                    if(!inBackquote)
                        throw new Error("comma not inside of backquote");

		    c = string.shift();
		    if(c == '@') {
                        var e = readSexpr.call(this, string);
                        if (this.batom([e]))
                            e = [ e, []];
		        return [ 'unquote-splice', e ];
		    } else {
		        string.unshift(c);
                        var e = readSexpr.call(this, string);
                        if (this.batom([e]))
                            e = [ e, []];
		        return [ 'unquote', e ];
		    }

                case '.':
                    return undefined;

	        case '(': {
		    var result = [];
                    var elt, c;

                    do {
                        elt = readSexpr.call(this, string);

                        if(elt === undefined) {
                            var elt2 = readSexpr.call(this, string);
                            var elt3 = readSexpr.call(this, string);
                            if(elt3 !== null) {
                                throw new Error("dot at wrong place in list!");
                            }
                            var result2 = result;
                            var result3 = result2;
                            while(this._null(result2[1]) !== 't')
                                result2 = result2[1];
                            result2[1] = elt2;
                            return result3;
                        } else {
                            if(elt || elt === 0 || elt === '')
                                result = [ elt, result ];
                        }
                    } while(elt || elt === 0 || elt === '');
                    
                    if(!(result.length === 0 || result.length === 2))
                        throw new Error("read an improper list!: " + result.length);

		    return this.reverse(result);
	        }

	        case ')':
		    return null;

                case '|':
                    return readBar(string);

	        default:
		    string.unshift(c); 
		    return readThing(string);
	        }
	    }

	    throw new Error("unterminated sexpr.");
        }

        return readSexpr.call(this, string.split(''));
    },

    exec: function (string) {
        var code = this.readFromString(string);
        this.add($.extend(true, [], code));
        var result = this.eval(code);
        this.bset(['*', result]);
        return this.printToString(result);
    },

    printToString: function(expr, ugly) {
        var pretty = !ugly;
        var retval;

        function removeParens(s) {
            s = s.slice(1);
            return s.slice(0, s.length-1);
        }

        if(this._null(expr) === 't') {
            retval = "()";
        } else if(Array.isArray(expr)) {
            retval = "(";
            var closeParens = ")";
            var special = false;
            while(this._null(expr) !== 't') {
                var val = expr[0];
                if(pretty && Array.isArray(val) && val[0] === "unquote") {
                    retval += ',' + removeParens(this.printToString(val[1])) + " ";
                    special = true;
                } else if(pretty && Array.isArray(val) && val[0] === "unquote-splice") {
                    retval += ',@' + removeParens(this.printToString(val[1])) + " ";
                    special = true;
                } else if(pretty && Array.isArray(val) && val[0] === "qquote") {
                    retval += '`' + removeParens(this.printToString(val[1])) + " ";
                    special = true;
                } else if(this._null(val) !== 't') {
                    retval += this.printToString(val) + (pretty && " " || " . (");
                } 
                closeParens += ")";
                expr = expr[1];

                if(typeof expr === "string" || typeof expr === "number" || typeof expr === "function") {
                    retval += ". " + this.printToString(expr);
                    break;
                }
            }

            retval = retval + (pretty && ")" || closeParens);
        } else if(typeof expr === "object" && expr && expr.values) {
            for(var i in expr.values) {
                if(expr.values[i])
                    retval += this.printToString(expr.values[i]) + "<br/>";
            }
            
        } else { retval = expr } 
        
        return retval;
    },

    saveCore: function (path) {
        path = path || "/core";

        var core = JSON.stringify({ env: this.env, fenv: this.fenv });

        console.log('sigil: saveCore: ', core, core.length);
        localStorage.setItem(path, core);
        return true;
    },

    loadCore: function (path) {
        path = path || "/core";

        console.log("sigil: loadCore: Loading core:", path);
        var core = JSON.parse(localStorage.getItem(path));

        if(core)
            this.reset(core.env, core.fenv);
        return true;
    }
});

//module.exports = Sigil;

console.log("Lisp is available.");
