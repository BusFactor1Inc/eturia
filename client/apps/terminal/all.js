var AppView = (function () {
    return new View({
        type: "Terminal",
        init: function (options) {
            this.create('blank', new (new View({})));
            this.create('rows', options.rows || 25);
            this.create('cols', options.cols || 80);
            this.create('cursorX', 0);
            this.create('cursorY', 0);
            this.create('grid',
                        x.spawnApplication(this,
                                           "grid",
                                           {
                                               rows: this.rows(), 
                                               cols: this.cols(),
                                               cellWidth: "8px",
                                               cellHeight: "12px",
                                               style: {
                                                   background: x.getApplicationOptions("cell").
                                                       style.background || "black",
                                               }
                                           }));
            this.on("change:cursorX", function(e) {
                this.disableCursor(e.value, this.cursorY())
                this.onCharacter(this.cursorX(), this.cursorY());
                this.setCursor(this.cursorX(), this.cursorY());
            });
            this.on("change:cursorY", function(e) {
                this.disableCursor(this.cursorX(), e.value);
                this.onCharacter(this.cursorX(), this.cursorY());
                this.setCursor(this.cursorX(), this.cursorY());
            });

            this.create('mode');
            this.on('change:mode', function(e) {
                if(this.mode()) {
                    this.$el.css({border: "1px solid green"});
                } else {
                    this.$el.css({border: "0px"});
                }
            });

            // This needs to be here for some reason
            // DON'T FIX OffCharacter.
            this.offCharacter(this.cols()-1, this.rows()-1);

            // if(options.help) ...
            this.insert(";Like VI, but different     Lisp Help\n"); 
            this.insert(";----------------------     ----------------------------\n\n");
            this.insert(";'?' is escape              * for last exec'd expression\n"); 
            this.insert(";'hjkl' to navigate         quote, set, cons, car, cdr, atom, eq, cond\n"); 
            this.insert(";'i' for insert mode        lambda, apply, eval, symbol-function\n"); 
            this.insert(";'e' to execute code        multple-value-bind, values, cond, qquote\n"); 
            this.insert(";'z' to clear               defmacro, setf, save, load,\n"); 
            this.insert(";'0' to first column        rm, rmf, env, fenv, +, -, *, /\n\n"); 
            this.insert(";This was your last statement:\n\n"); 

            this.create('history', 0);
            this.on('change:history', function(e) {
                this.clearScreen();
                var index = this.lisp.length - 1 - this.history();
                try {
                    var code = this.lisp.current(index, true)
                    this.insert(code);
                } catch(e) {
                    console.error("terminal: no history at " + this.history());
                }
            });
            setTimeout(function () {
                this.insert(this.lisp.current(this.lisp.length-1, true));
            }.bind(this), 0);
        },

        newline: function() {
            this.cursorX(0);
            return this.cursorY(this.cursorY()+1);
        },

        keyPress: function(e) {
            console.log(e.value.charCode);
            if(!this.mode()) {
                if(e.value.charCode === 13) {
                    this.cursorX(0);
                    this.cursorY(this.cursorY()+1);
                } else if(e.value.charCode === 104) {
                    this.cursorX(this.cursorX()-1);
                } else if(e.value.charCode === 108) {
                    this.cursorX(this.cursorX()+1);
                } else if(e.value.charCode === 106) {
                    this.cursorY((this.cursorY()+1)%this.rows());
                } else if(e.value.charCode === 107) {
                    this.cursorY(this.cursorY()-1);
                } else if(e.value.charCode === 101) {
                    this.execute();
                } else if(e.value.charCode === 99) {
                    this.onCharacter(this.cursorX(), this.cursorY());
                } else if(e.value.charCode === 100) {
                    this.offCharacter(this.cursorX(), this.cursorY());
                } else if(e.value.charCode === 122) {
                    this.clearScreen();
                } else if(e.value.charCode === 48) {
                    this.cursorX(0);
                } else if(e.value.charCode === 112) {
                    this.previousHistory();
                } else if(e.value.charCode === 110) {
                    this.nextHistory();
                } else if(e.value.charCode === 68) {
                    this.deleteCoreEntry();
                } else {
                    this.mode(e.value.charCode === 105);
                } 
            } else {
                if(this.mode(e.value.charCode !== 63)) {
                    this.insert(String.fromCharCode(e.value.charCode));
                }
            }
            e.value.preventDefault();
        },

        execute: function() {
            var code = "";
            for(var i = 0; i < this.grid().rows(); i++) {
                for(var j = 0; j < this.grid().cols(); j++) {
                    var cell = this.grid().getColRow(j, i);
                    code += cell.text();
                }
                code += "\n";
            }
            
            if(this.debug) {
                var x = [];
                for(var i in code) {
                    x.unshift(code[i]);
                }
                console.log('terminal: execute', x);
            }
            
            this.trigger('lispCode', code);
        },

        clearScreen: function(loud) {
            this.debug && console.log('terminal:clearScreen');
            this.cursorX(0);
            this.cursorY(0);
            for(var i = 0; i < this.rows(); i++) {
                for(var j = 0; j < this.cols(); j++) {
                    this.setCharacter(j, i, ' ', false, {background: "transparent"});
                }
            }
            this.cursorX(0);
            this.cursorY(0);
        },

        _setCursorCell: function(px, py, cell, loud) {
            return setTimeout(function () {
                this.grid().setColRow(px, py, cell, false, !loud);
            }.bind(this), 0); // wierd
        },

        getCursor: function (px, py) {
            return this.grid().getColRow(px, py);
        },

        setCursor: function (px, py) {
            var cell = this.grid().getColRow(px, py);
            cell.blink(true);
            return cell;
        },

        offCharacter: function (px, py, loud) {
            return this._setCursorCell(px, py, x.spawnApplication(this, "cell", {}), loud);
        },

        enableCursor: function(px, py, loud) {
            var cell = this.setCursor(px, py);
            cell.blink(true);
        },

        disableCursor: function(px, py, loud) {
            var cell = this.getCursor(px, py);
            cell.blink(false);
        },

        onCharacter: function (px, py) {
            var cell = this.getCursor(px, py);
            cell.$el.css({background: "black"});
        },

        setCharacter: function(px, py, character, blink, style, loud) {
            var cell = this.getCursor(px, py);
            if(blink !== undefined)
                cell.blink(blink);
            if(character !== undefined)
                cell.text(character);
            if(style !== undefined)
                cell.$el.css(style);
        },
        
        blinkCharacter: function (px, py, blink) {
            var cell = this.getCursor(px, py);
            cell.blink(blink);
        },

        toggleCharacter: function (px, py) {
            this.getCursor(px, py).toggle();
        },

        insert: function(stringOrCode, blink, loud) {
            if(Array.isArray(stringOrCode)) {
                this.insert(this.lisp.printToString(stringOrCode));
            } else {
                for(c in stringOrCode) {
                    this.setCharacter(this.cursorX(), this.cursorY(),
                                      stringOrCode[c], blink, loud);
                    if(stringOrCode[c] === '\n' || stringOrCode[c] === '\r') {
                        this.cursorX(0);
                        this.cursorY(this.cursorY()+1);
                    } else {
                        this.cursorX((this.cursorX()+1)%this.cols());
                    }
                }
            }
        },

        render: function() {
            return this.$el.html(this.grid().$el);
        },

        previousHistory: function() {
            this.history(this.history()+1);
        },

        nextHistory: function() {
            if(this.history() >= 0)
                this.history(this.history()-1);
        },

        deleteCoreEntry: function (index) {
            index = this.history();
            console.log('terminal: deleteCoreEntry: ' + index);
            this.lisp && this.lisp.remove(this.lisp.current());
            this.trigger('saveCore');
        }
    });
})();

x.registerApplication("terminal", AppView, {
    title: "Terminal"
});
