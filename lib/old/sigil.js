/* TODO: make f'ing work */

var Lisp = (function () {
    console.log("Lisp is available.");
    return new Model({
        type: "Lisp",
        model: "options",

        init: function (options) {
            options = options || {};
            this.create('env',{
                't': 't',
                'nil': [],
            });

            this.create('fenv', {
                'atom': this.batom.bind(this),
                'set': this.bset.bind(this),
                'car': this.bcar.bind(this),
                'cdr': this.bcdr.bind(this),
                'cons': this.bcons.bind(this),
                'eq': this.beq.bind(this),
                'eval': this.beval.bind(this),
                'apply': this.bapply.bind(this),
                'env': this.benv.bind(this),
                'fenv': this.bfenv.bind(this),
                '+': this.bplus,
                '*': this.btimes,
                '-': this.bminus,
                '/': this.bdivide,
                'save': this.saveCore.bind(this),
                'load': this.loadCore.bind(this),
                'rm': this.brm.bind(this),
                'rmf': this.brmf.bind(this),
            });

            this.create('triggerTrace', false);
            
            options.core && this.loadCore(options.core);
            this.length && this.current(0);

            this.t = this.env()['t'];
            this.nil = this.env()['nil'];

            this.debug = true;
        },

        exec: function (string) {
            var code = this.readFromString(string);
            this.add($.extend(true, [], code));
            var result = this.beval.call(this, code);
            this.bset('*', result);
            return this.printToString(result);
        },


        //--------------------------------------------------------------------------------
        batom: function (args) {
            var x = args[0];                         
            this.debug && console.log("sigil: batom: ", args, x, typeof x);
            return (typeof x === "string" || typeof x === "number" ||
                    (Array.isArray(x) && x.length === 0)) && "t" || [];
        },

        bprogn: function (args) {
            function helper(exprs, result) {
                if(this.bnull(exprs)) {
                    return result;
                } else {
                    var value = this.beval(exprs[0]);
                    return helper.call(this, exprs[1], value);
                }
            }
            return helper.call(this, args);
        },

        brm: function () {
            var old = this.env();
            for(var i in arguments) {
                delete old[arguments[i]];
            };
            this.env(old);
            return old;
        },
        
        brmf: function () {
            var old = this.fenv();
            for(var i in arguments) {
                delete old[arguments[i]];
            };
            this.fenv(old);
            return old;
        },
        
        bplus: function() {
            var sum = 0;
            for(var i = 0; i < arguments.length; i++) {
                if(typeof arguments[i] === "number") {
	            sum += arguments[i];
                }
            }
            return sum;
        },

        bminus: function() {
            var difference = 0;
            for(var i = 0; i < arguments.length; i++) {
                if(typeof arguments[i] === "number") {
	            difference -= arguments[i];
                }
            }
            return difference;
        },

        btimes: function() {
            var product = 1;
            for(var i = 0; i < arguments.length; i++) {
                if(typeof arguments[i] === "number") {
	            product *= arguments[i];
                }
            }
            return product;
        },

        bdivide: function() {
            var value = arguments[0];
            for(var i = 1; i < arguments.length; i++) {
                if(typeof arguments[i] === "number") {
	            value /= arguments[i];
                }
            }
            return value;
        },

        bquote: function (x) {
            return x;
        },

        bcar: function (list) {
            return list[0] || [];
        },

        bcdr: function (list) {
            return list.slice(1);
        },

        bcons: function (args) {
            var car = args[0], cdr = args[1][0];
            return [car, cdr];
        },

        evlambda: function  (fun, args) {
            var vars = fun[1][0];
            var saved = {}

            function saveVariables(vars, args) {
                if(this.bnull(args) && !this.bnull(vars)) {
	            throw new Error("Not enough arguments for function: ", fun, vars);
                }

                if(this.bnull(args)) {
                    return;
                }

	        if(vars[0] != '&rest' && vars[0] != '&body' && this.env()[vars[0]] !== undefined) {
	            saved[vars[0]] = this.env()[vars[0]];
	        }
	        if(!Array.isArray(args[0]) && args[0] && args[0].values !== undefined) {
	            this.env()[vars[0]] = args[0].values[0];
	        } else {
	            if(vars[0] == '&rest' || vars[0] == '&body') {
		        this.env()[vars[1][0]] = args;
                        return;
	            } else {
		        this.env()[vars[0]] = args[0];
                    }
                    saveVariables.call(this, vars[1], args[1]);
	        }
            }

            saveVariables.call(this, vars, args);

            //var result = this.bprogn(fun[1][1]);
            console.log('function', fun[1][1]);
            var result = this.bprogn(fun[1][1][0]);
            
            // restore variables
            function restoreVariables (vars) {
                if(this.bnull(vars)) {
                    return;
                } else {
	            delete this.env()[vars[0]];
	            if(saved[vars[0]] !== undefined) {
	                this.env()[vars[0]] = saved[vars[0]];
	            }
                    restoreVariables.call(this, vars[1]);
                }
            }
            restoreVariables.call(this, vars);
            
            return result;
        },

        bapply: function (args) {
            var fun = args[0];
            var args = args[1];
            function evlis(list) {
                function helper(l, a) {
                    if(l.length === 0) {
                        return a;
                    } else {
                        return helper.call(this, l[1], [this.beval(l[0]), a]);
                    }
                }
                
                return helper.call(this, list, []);
            }

            if(typeof fun === "string") {
	        fun = this.fenv()[fun];
            }
            if(Array.isArray(fun) && fun[0] === 'macro') {
                var code = this.evlambda(fun, args);
                console.log('sigil: bapply: code: ', code);
	        return this.beval(code);
            } else {
	        var args = evlis.call(this, args);
	        if(typeof fun == "function") {
                    this.debug && console.log("sigil: bapply: args: ", args);
                    return fun.call(this, args);
	        } else if(Array.isArray(fun) && fun[0] === 'lambda') {
	            return this.evlambda(fun, args);
	        } else {
	            throw new Error("undefined function: " + fun);
	        }
            }
	    
            throw new Error("apply: " + fun + ": " + args);
        },

        bset: function (v, expr) {
            if(typeof v === "string") {
	        return this.env()[v] = expr;
            } else
	        throw new Error("attempt to set non-symbol value: " + v);
        },

        benv: function (e) {
            if(e) {
                this.env(e);
            } else {
                var env = this.env();
                var retval = [];
                for(var i in env) {
                    retval = [i, [ env[i], [ retval ]]];
                }
            }
            return retval;
        },

        bfenv: function () {
            var env = this.fenv();
            var retval = [];
            for(var i in env) {
                var val = env[i];
                if(typeof val === "function")
                    val = "builtin";
                retval = [ i, [ val, [ retval ]]];
            }
            return retval;
        },

        bprint: function (expr) {
            if(!Array.isArray(expr) && expr != undefined && expr.values !== undefined) {
	        for(var i = 0; i < expr.values.length-1; i++) {
	            console.log(expr.values[i]);
	        }
            } else {
	        console.log(expr);
            }
        },

        bsetf: function(args) {
            var place = args[0];
            var value = args[1][0];

            switch(place[0]) {
            case 'car':
                var p = place[1];
                return p[0] = value;
            case 'cdr':
                var p = place[1];
                return p[1] = value;
            case 'symbol-function':
	        return this.fenv()[place[1]] = value;
            default:
	        return this.bset(place, this.beval(value));
            }
        },

        bvalues: function() {
            return { 'values': Array.prototype.slice.call(arguments) };
        },

        bMultipleValueBind: function (exprs) {
            var args = exprs[0];
            var values = this.beval(exprs[1]);
            var body = exprs.slice(2);

            var lambda = ['lambda', args];
            lambda = lambda.concat(body);
            return this.bapply([lambda, values.values]);
        },

        bdefmacro: function (a) {
            var name = a[0];
            var args = a[1][0];
            var body = a[1][1];

            var macro = [ 'macro', [ args, [ body, []]]];
            this.fenv()[name] = $.extend(true, [], macro);
            return macro;
        },

        bmacroexpand: function (expr) {
        },

        bqquote: function(args) {
            var expr = args[0];
            this.debug && console.log("sigil: bqquote: ", args, expr);
            function helper(e, a) {
                if(this.bnull(e)) {
                    return a;
                } else if(!this.bnull(this.batom([e]))) {
                    return e;
                } else if(Array.isArray(e) && e.length > 0 && e[0] === 'unquote') {
                    return this.beval(e[1][0]);
                } else if(Array.isArray(e) && e.length > 0 &&
                          Array.isArray(e[0]) && e[0].length > 0 && e[0][0] === 'unquote-splice') {
                    a[1] = this.beval(e[0][1][0]);  // NOTE: a.push(...) instead?
                    return helper.call(this, e[1], a);
	        } else {
/*                    return helper.call(this, e[1],
                                       this.reverse([ helper.call(this, e[0], []),
                                                      a ])); */
                    var x = helper.call(this, e[0], a);
                    if(Array.isArray(x) && x.length > 0) {
                        x = this.reverse(x);
                    }
                    return helper.call(this, e[1], x);
  
                }
            }
            
            var r = helper.call(this, expr, []);
            console.log("sigil: bqquote: r: ", r, this.reverse(r));
            return r;
        },

        bmacroexpand: function(expr) {
            
        },

        beq: function() {
            this.debug && console.log('beq: expr: ', arguments);
            var a = arguments[0];
            var b = arguments[1];
            if(a == b)
                return this.t;
            return [];
        },

        bnull: function (x) {
            return (Array.isArray(x) &&
                    x.length === 0);
        },

        bcond: function(args) {
            for(var i in args) {
                var e = args[i];
                var test = e[0];
                var body = e[1];
                var result = this.beval(test);

                this.debug && console.log('sigil: bcond: test, body: ', test, body, result);
                if(!this.bnull(result)) {
                    return this.beval(body);
                }
            }
            return [];
        },
        
        reverse: function (expr) {
            function helper(e, a) {
                console.log(e);
                if(this.bnull(e)) {
                    return a;
                }
                return helper.call(this, e[1], [e[0], a]);
            }
            
            var r = helper.call(this, expr, []);;
            console.log("sigil: reverse: ", expr, r);
            return r;
        },

        beval: function (args) {
            var expr = args;
            if(Array.isArray(expr)) {
	        var car = expr[0];
	        var cdr = expr[1];
                if(this.triggerTrace() === 1)
                    this.trigger(car, cdr);
	        switch(car) {
	        case 'qquote':
	            return this.bqquote(cdr);
	        case 'lambda':
	            return expr;
	        case 'setf':
	            return this.bsetf(cdr);
	        case 'values':
	            return this.bvalues.apply({}, cdr);
	        case 'multiple-value-bind':
	            return this.bMultipleValueBind(cdr);
	        case 'symbol-function':
	            return this.fenv()[cdr[0]];
	        case 'defmacro':
	            return this.bdefmacro(cdr);
	        case 'cond':
	            return this.bcond(cdr);
	        case 'progn':
	            return this.bprogn(cdr);
	        default:
	            return this.bapply([car, cdr]);
	        }
            } else if(typeof expr === "string") {
	        if(this.env()[expr] === undefined) {
	            throw new Error("undefined symbol: " + expr);
	        }
                if(expr === 'nil') {
                    return [];
                } 

	        return this.env()[expr];
            } else {
	        return expr;
            }

            throw new Error("eval error:" + expr);
        },

        isNumberThing: function (c) {
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
	        c === '-' ||
	        c === '.';
        },

        readFromString: function (string) {
            function terminator(c) {
	        return c === undefined ||
	            c === ' ' ||
	            c === '\n' ||
	            c === '\r' ||
	            c === '(' ||
	            c === ')';
            }

            function readSymbol (string) {
	        var symbol = "";
	        while(!terminator(string[0])) {
	            symbol += string[0];
	            string.shift();
	        }
	        return symbol;
            }

            function readNumber (string) {
	        var number = "";
	        var isNumber = true;
	        while(!terminator(string[0])) {
	            isNumber &= this.isNumberThing(string[0]);
	            number += string[0];
	            string.shift();
	        }
	        if(isNumber)
                    if(number === "-") {
                        return number;
                    } else {
	                return parseFloat.call(this, (number));
                    }
	        else
	            return number;
            }

            function readSexpr(string) {
                this.debug && console.log('sigil: readSexpr: ', string);
	        while(string[0] != undefined) {
	            var c = string.shift();
	            switch(c) {
                    case ';': {
                        c = string.shift();
                        while(c !== undefined && (c != '\n' && c != '\r')) {
                            c = string.shift();
                        }
                    }
	            case ' ':
	            case '\n':
	            case '\r':
	            case '\t':
		        continue;

	            case '`': {
                        var s = readSexpr.call(this, string);
                        return ['qquote', [ s, []]];
                    }

	            case ',':
		        c = string.shift();
		        if(c == '@')
		            return ['unquote-splice', [ readSexpr.call(this, string), []]];
		        else {
		            string.unshift(c);
		            return [ 'unquote', [ readSexpr.call(this, string), []]];
		        }

	            case '(': {
		        var result = [];

		        for(var elt = readSexpr.call(this, string); elt !== null;  
                            elt = readSexpr.call(this, string)) {
                            result = [elt, result];
		        }
		        return this.reverse.call(this, result);
	            }

	            case ')':
		        return null;

	            default:
		        string.unshift(c); 
		        if(this.isNumberThing(c)) {
		            return readNumber.call(this, string);
		        }

		        return readSymbol.call(this, string);
	            }
	        }

	        throw new Error("unterminated sexpr.");
            }

            return readSexpr.call(this, string.split(''));
        },

        refresh: function (fenv) {
            fenv = fenv || {};
            var defaultFenv = {
                'atom': this.batom.bind(this),
                'set': this.bset.bind(this),
                'car': this.bcar.bind(this),
                'cdr': this.bcdr.bind(this),
                'cons': this.bcons.bind(this),
                'eq': this.beq.bind(this),
                'eval': this.beval.bind(this),
                'apply': this.bapply.bind(this),
                'env': this.benv.bind(this),
                'fenv': this.bfenv.bind(this),
                '+': this.bplus,
                '*': this.btimes,
                '-': this.bminus,
                '/': this.bdivide,
                'save': this.saveCore.bind(this),
                'load': this.loadCore.bind(this),
                'rm': this.brm.bind(this),
                'rmf': this.brmf.bind(this),
            };
            for(i in defaultFenv) {
                fenv[i] = defaultFenv[i];
            }
            this.fenv(fenv);
        },

        saveCore: function (path) {
            path = path || "/core";
            var core = JSON.stringify(this.map(function (e) { return e; }));
            console.log("sigil: saveCore: ", core.length);
            //this.debug && console.log("sigil: saveCore: core: ", core);
            localStorage.setItem(path, core);
        },

        loadCore: function(path, clear) {
            var retval;
            path = path || "/core";

            clear && this.clear();
            var core = JSON.parse(localStorage.getItem(path)) || [] ;
            console.log("sigil: loadCore: core: " +  core);
            for(var i in core) {
                var code = core[i];
                this.add($.extend(true, [], code));
                try {
                    retval = this.beval(code);
                    console.log("sigil: loadCore: " +  code, retval);
                } catch (e) { 
                    console.error("sigil: loadCore: " + e + ": " + core[i]);
                }
            }
            return retval;
        },

        listp: function(expr) {
            return Array.isArray(expr);
        },
        
        printToString: function(expr, ugly) {
            var retval;
            var pretty = !ugly;

            function doit (expr, pretty, retval) {
                if(Array.isArray(expr) && expr.length !== 0) {
                    var val = expr[0];
                    retval += "(" + val + " . " +  doit(expr[1], pretty, retval) + ')';
                    console.log("sigil: printToString: ", retval);
                } else if(typeof expr === "object" && expr && expr.values) {
                    for(var i in expr.values) {
                        if(expr.values[i])
                            retval += expr.values[i] + "<br/>";
                    }
                    
                } else if(Array.isArray(expr) && expr.length === 0) {
                    retval += '()';
                } else {
                    retval += expr
                }
                return retval;
            }

            return doit(expr, pretty, "");

            /*
            if(Array.isArray(expr)) {
                retval = "(";
                var closeParens = ")";
                for(var i in expr) {
                    var val = expr[i];
                    if(pretty && Array.isArray(val) && val[0] === "unquote") {
                        retval += ',' + this.printToString(val[1]) + " ";
                    } else if(pretty && Array.isArray(val) && val[0] === "qquote") {
                        retval += '`' + this.printToString(val[1]) + " ";
                    } else if(val != "nil") {
                        retval += this.printToString(val) + (pretty && " " || " . (");
                    } 
                    closeParens += ")";
                }
                retval = retval + (pretty && ")" || closeParens);
            } else if(typeof expr === "object" && expr && expr.values) {
                for(var i in expr.values) {
                    if(expr.values[i])
                        retval += expr.values[i] + "<br/>";
                }
                
            }else { retval = expr } 
            */
            return retval;
        }
    });
})();
