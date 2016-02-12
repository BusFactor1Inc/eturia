var AppView = new View({
    type: "Listener",
    tagName: "textarea",
    style: {
        width: "100%",
    },
    events: {
        keypress: function (e) {
            if(e.charCode === 13 && !e.shiftKey) {
                var code = this.$el.val();
                if(this.triggerLispCode()) {
                    this.trigger('lispCode', code);
                } else {
                    x.runApplication({
                        app: "hello",
                        title: code,
                        text: this.lisp().exec(code)
                    });
                }
                this.$el.val('');
                e.preventDefault();
            }
        }
    },
    init: function(options) {
        this.create('triggerLispCode',
                    options.triggerLispCode);
        this.create('lisp', options.lisp || new Lisp());
        this.on('dragStart', function () { } );
        this.on('drag', function () { } );
        this.on('dragStop', function () { } );
    }
});

x.registerApplication("listener", AppView, {
    title: "Listener",
    lisp: new Lisp(),
    style: {
        width: "40em",
        height: "3em",
        padding: ".25em"
    }
});
