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
        },

        exec: function (string) {
            var code = this.readFromString(string);
            this.add($.extend(true, [], code));
            var result = this.beval.call(this, code);
            this.bset('*', result);
            return this.printToString(result);
        },


        //--------------------------------------------------------------------------------
        bprogn: function (args) {
            var result, i = 0;
            while(args[i] !== 'nil') {
                console.log('bprogn: ' + args[i]);
                result = this.beval(args[i]);
                i++;
            }
            return result;
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
            console.log(arguments);
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

        bcons: function (car, cdr) {
            if(Array.isArray(cdr)) {
	        cdr.unshift(car);
	        return cdr;
            }
            return [car, cdr];
        },

        evlambda: function  (fun, args) {
            var vars = fun[1];
            var saved = {}
            // save variables
            var i;
            for(i = 0; i < vars.length-1; i++) {
	        if(vars[i] != '&rest' && vars[i] != '&body' && this.env()[vars[i]] !== undefined) {
	            saved[vars[i]] = this.env()[vars[i]];
	        }
	        if(!Array.isArray(args[i]) && args[i].values !== undefined) {
	            this.env()[vars[i]] = args[i].values[0];
	        } else {
	            if(vars[i] == '&rest' || vars[i] == '&body') {
		        i++;
		        this.env()[vars[i]] = args.slice(i-1, args.length-1);
		        i = args.length - 1;
		        break;
	            } else
		        this.env()[vars[i]] = args[i];
	        }
            }

            if(i != args.length -1) {
	        throw new Error("Not enough arguments for function: " + fun);
            }

            
            var cur = 2;
            var result;
            for(var expr = fun[cur]; cur < fun.length-1; expr = fun[++cur]) {
	        result = this.beval(expr);
            }
            
            // restore variables
            for(var i = 0; i < vars.length-1; i++) {
	        delete this.env()[vars[i]];
	        if(saved[vars[i]] !== undefined) {
	            this.env()[vars[i]] = saved[vars[i]];
	        }
            }
            
            return result;
        },

        bapply: function (fun, args) {
            function evlis(list) {
	        var result = []
	        list.forEach(function (x) {
                    this.debug && console.log('evlis: list: ', result);
	            var tmp = this.beval(x);
	            if(!Array.isArray(tmp) && tmp.values != undefined && tmp.values !== undefined) {
		        tmp = tmp.values[0];
	            }
	            result.push(tmp);
	        }.bind(this));
                this.debug && console.log('evlis: result: ', result);
	        return result;
            }

            if(typeof fun === "string") {
	        fun = this.fenv()[fun];
            }
            if(Array.isArray(fun) && fun[0] === 'macro') {
	        return this.beval(this.evlambda(fun, args));
            } else {
	        var args = evlis.call(this, args);
	        if(typeof fun == "function") {
                    console.log("bapply: args: ", args);
	            return fun.apply({}, args);
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

        benv: function () {
            var env = this.env();
            var retval = [];
            for(var i in env) {
                retval = this.bcons(this.bcons(i, env[i]), retval);
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
                retval = this.bcons(this.bcons(i, val), retval);
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

        bsetf: function(place, value) {
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
            return this.bapply(lambda, values.values);
        },

        bdefmacro: function (expr) {
            var name = expr[0];
            var args = expr[1];
            var body = expr.slice(2);

            var macro = [ 'macro', args ];
            macro = macro.concat(body);
            this.fenv()[name] = $.extend(true, [], macro);
            return macro;
        },

        bmacroexpand: function (expr) {
        },

        bqquote: function(expr) {
            var result = [];
            for(var i = 0; i < expr.length; i++) {
	        e = expr[i];
	        if(Array.isArray(e) && e[0] === 'unquote')
	            result.push(this.beval(e[1]));
	        else if(Array.isArray(e) && e[0] === 'unquote-splice')
	            result = result.concat(this.beval(e[1]).slice(0, e[1].length-1));
	        else if(Array.isArray(e)) {
	            result.push(this.bqquote(e));
	        } else
	            result.push(e);
            }
            return result;
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
            console.log('here', args);
            for(var i in args) {
                var e = args[i];
                var test = e[0];
                var body = e[1];
                var result = this.beval(test);

                console.log('bcond: test, body: ', test, body, result);
                if(!this.bnull(result)) {
                    return this.beval(body);
                }
            }
            console.log('here');
            return [];
        },

        beval: function (expr) {
            if(Array.isArray(expr)) {
	        var car = expr[0];
	        var cdr = expr.slice(1);
                if(this.triggerTrace() === 1)
                    this.trigger(car, cdr);
	        switch(car) {
	        case 'quote':
	            return this.bquote(cdr[0]);
	        case 'qquote':
	            return this.bqquote(cdr[0]);
	        case 'lambda':
	            return expr;
	        case 'setf':
	            return this.bsetf(cdr[0], cdr[1]);
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
                    console.log('bapply', car, cdr);
	            return this.bapply(car, cdr);
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

	            case '\'':
		        return [ 'quote', readSexpr.call(this, string)];

	            case '`':
		        return [ 'qquote', readSexpr.call(this, string)];

	            case ',':
		        c = string.shift();
		        if(c == '@')
		            return [ 'unquote-splice', readSexpr.call(this, string)];
		        else {
		            string.unshift(c);
		            return [ 'unquote', readSexpr.call(this, string)];
		        }

	            case '(': {
		        var result = [];

		        for(var elt = readSexpr.call(this, string); elt !== null;  
                            elt = readSexpr.call(this, string)) {
		            result.push(elt);
		        }
		        result.push('nil');
		        return result;
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
            console.log('path', path);
            path = path || "/core";
            console.log('path', path);
            var core = JSON.stringify(this.map(function (e) { return e; }));
            console.log("lisp: saveCore: ", core.length);
            this.debug && console.log(core);
            localStorage.setItem(path, core);
        },

        loadCore: function(path, clear) {
            var retval;
            path = path || "/core";

            clear && this.clear();
            var core = JSON.parse(localStorage.getItem(path)) || [] ;
            console.log("lisp: loadCore: core: " +  core);
            for(var i in core) {
                var code = core[i];
                this.add($.extend(true, [], code));
                try {
                    retval = this.beval(code);
                    console.log("lisp: loadCore: " +  code, retval);
                } catch (e) { 
                    console.error("lisp: loadCore: " + e + ": " + core[i]);
                }
            }
            return retval;
        },
        
        printToString: function(expr, ugly) {
            var retval;
            var pretty = !ugly;
            if(Array.isArray(expr)) {
                retval = "(";
                var closeParens = ")";
                for(var i in expr) {
                    var val = expr[i];
                    if(pretty && Array.isArray(val) && val[0] === "unquote") {
                        retval += ',' + this.printToString(val[1]) + " ";
                    } else if(pretty && Array.isArray(val) && val[0] === "qquote") {
                        retval += '`' + this.printToString(val[1]) + " ";
                    } else if(val !== "nil") {
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
                
            }else {
                retval = expr
            }
            return retval;
        }
    });
})();
