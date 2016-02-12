var AppView = (function () {
    var blank = new View({});
    var Layer = new View({
        tagName: "table",
        style: {
            borderSpacing: "0px",
            borderCollapse: "0px",
            
        },

        init: function (model) {
            this.create('grid', model); // embed model
            this.create('visible', true);

            this.resize(this.grid().cols(), this.grid().rows(), true);
            this.grid().on('change', function (e) {
                if(e.target.type === "GridView") {
                    this.resize(e.target.cols(),
                                e.target.rows(), true);
                }
            }.bind(this));
        },

        resize: function (cols, rows, silent) {
            if(cols && rows) {
                var newSize = cols*rows;
                this.clear(silent);
                for(var i = 0; i < newSize; i++) {
                    this.add(this.grid().initialElement() || 
                             x.spawnApplication(this,
                                                "cell",
                                                {
                                                    style: {
                                                        width: this.grid().cellWidth(),
                                                        height: this.grid().cellHeight(),
                                                    }
                                                }), true, silent);
                }
            }
        },

        getColRow: function(col, row, silent) {
            var index = row*(this.grid().cols()) + col;
            return this.current(index, silent);
        },

        setColRow: function(col, row, appView, noRender, silent) {
            var index = row*(this.grid().cols()) + col;
            this.remove(index, silent);
            this.insertAt(index, appView, silent);
            if(!noRender)
                this.render();
        },

        render: function () {
            this.$el.html([]);
            for(var i = 0; i < this.grid().rows(); i++) {
                var tr = $("<tr>");
                for(var j = 0; j < this.grid().cols(); j++) {
                    var td = $("<td>");
                    var index = i*this.grid().cols() + j;
                    td.html(this.at(index).$el);
                    tr.append(td);
                }
                this.$el.append(tr);
            }
            return this.$el;
        }
    });

    return new View({
        type: "GridView",
        model: "options",
        init: function(model) {
            this.create('cols', this.options.cols || 1);
            this.create('rows', this.options.rows || 1);
            this.create('layers', this.options.layers || 1);
            this.create('cellWidth', this.options.cellWidth);
            this.create('cellHeight', this.options.cellHeight);
            this.create('initialElement',
                        this.options.initialElement);
                        
            for(var i = 0; i < this.layers(); i++) {
                this.add(new Layer(this));
            }
            this.current(0);

            this.create('layer', 0);
            this.on('modified', this.render);
            this.on('modified:layer', function (e) {
                var n = e.value;
                if(n < 0 || n >= this.layers()) 
                    throw new Error("grid: attempt to set to invalid layer number: " + n);
             });

            this.on('change:visible', this.render());
            this.on('change:current', function (e) { 
                //this.trigger('gridAddressChange', e);
            }); // HACK causes trigger loop if not here
        },

        setColRow: function (col, row, appView, noRender, silent) {
            this.current().setColRow(col, row, appView, noRender, silent);
            if(!noRender)
                this.render();
        },

        getColRow: function (col, row, silent) {
            return this.current().getColRow(col, row, silent);
        },

        render: function () {
            var html = this.map(function (layer) {
                if(layer.visible())
                    return layer.$el;
            });

            this.$el.html(html);
        },

        broadcast: function(funName, e, loud) {
            for(var i = 0; i < this.rows(); i++) {
                for(var j = 0; j < this.cols(); j++) {
                    var thing  = this.getColRow(j, i);
                    thing[funName] && thing[funName](e, !loud);
                    if(thing.broadcast) {
                        thing.broadcast(funName, e, loud);
                    } 
                    if(thing.grid && thing.grid().broadcast) {
                        thing.grid().broadcast(funName, e, loud);
                    } 
                }
            }
        }
    });
})();

x.registerApplication("grid", AppView, {});
