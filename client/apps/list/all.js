var AppView = new View({
    type: "ListView",
    init: function (options) {
        this.create('reverse', options.reverse);
        this.on('add', this.render);
    },
    render: function() {
        if(!this.reverse()) {
            this.each(function(e) {
                this.$el.append(e.$el);
            });
        } else {
            this.each(function(e) {
                this.$el.prepend(e.$el);
            });
        }
        return this.$el;
    }
});

x.registerApplication("list", AppView, {});
