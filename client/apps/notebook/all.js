var AppView = new View({
    type: "Notebook",
    init: function (options) {
        this.create('grid', x.spawnApplication(this, "grid", { rows: 2 }));
        this.create('terminal', x.spawnApplication(this, "terminal", {
            style: {
                border: "1px solid black"
            }
        }));
        this.create('list', x.spawnApplication(this, "list", {
            reverse: true,
            style: {
                border: "2px solid black"
            }
        }));
        this.grid().setColRow(0, 0, this.terminal());
        this.grid().setColRow(0, 1, this.list());

        this.on('lispCode', function (e) {
            console.log('notebook: lispCode: ' + e);
            var code = e.value;
            var result, error = false;
            try {
                result = String(this.lisp.exec(code));
            } catch (e) {
                error = true;
 
                result = e.message;
            }

            var codeView = x.spawnApplication(this, "hello", {
                app: "hello",
                text: code,
                style: {
                    padding: ".5em",
                    background: error && "red" || "green",
                    fontWeight: "bold"
                }
            });

            var resultView = x.spawnApplication(this, "hello", {
                app: "hello",
                text: result,
                style: {
                    padding: ".5em",
                    background: "white"
                }
            });
            this.list().add(codeView, true);
            this.list().add(resultView);
            this.trigger('saveCore');
        });
    },

    
    render: function() {
        return this.$el.html(this.grid().$el);
    }
});

x.registerApplication("notebook", AppView, {
    title: "Notebook"
});
