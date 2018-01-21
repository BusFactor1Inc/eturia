var AppView = new View({
    type: "Cell",
    model: "options",
    init: function (options) {
        this.create('enabled');
        this.create('text', options.text || ' ');
        this.create('blink');
        this.create('blinkTime', options.blinkTime || 1000);
        this.create('blinkColor', options.blinkColor || "black");

        this.create('timer');
        var blink;
        this.on('change:blink', function (e) {
            this.debug && console.log('change:blink', this.blink(), this);
            if(this.blink()) {
                this.timer(setInterval(function () {
                    if(blink) {
                        this.$el.css({transition: "ease-in .25s", 
                                      background: "transparent"});
                    } else {
                        this.$el.css({
                                      background: this.blinkColor()});
                    }
                    blink = !blink;
                }.bind(this), this.blinkTime()));
            } else {
                this.debug && console.log('timer', this.timer());
                clearInterval(this.timer());
                this.timer(undefined);
                this.$el.css({background: "transparent"});
            }
            // this.trigger('blink'); FIXME causes trigger loop
        });
        this.on('change:enabled', function (e) {
            if(this.enabled()) {
                this.$el.css({transition: "ease-in .25s", 
                              background: this.blinkColor()});      
            } else {
                this.$el.css({transition: "ease-in .25s", 
                              background: "transparent"});
            }
        });
        this.on('dragStart', function (e) {
            this.toggle(true);
        });

        this.on('change:timer', function () {} );
        this.on('change:text', this.render);
        this.on('change:blink', this.render);
        this.on('deleteWindow', function (e) {
            this.timer() && clearInterval(this.timer());
        });
        this.blink(options.blink);
    },

    toggle: function (loud) {
        this.blink(false, loud);
        this.enabled(!this.enabled(), !loud);
    },
    
    render: function () {
        this.$el.text(this.text());
        return this.$el;
    }
});

x.registerApplication("cell", AppView, {
    title: "Cell",
    style: {
        width: "8px",
        height: "12px",
        background: "transparent"
    }
});
