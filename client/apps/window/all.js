var AppView = (function () {
    return new View({
        type: "Window",
        model: "options",
        style: Styles.Window,
        init: function(options, parent) {
            if(!options.noTitleBar) {
                this.add(this.create('titleBar',
                                     x.spawnApplication(this, 
"titlebar",
                                                        options)));
            }
            this.add(this.create('app', x.spawnApplication(this, 
                                                           options.app,
                                                           options)));

            this.options.width && this.$el.width(this.options.width);
            this.options.height && this.$el.height(this.options.height);
            this.on('change', this.render);
        },

        render: function () {
            return this.$el.html(this.map(function(e){return e.$el; }));
        }
    });
})();

x.registerApplication("window", AppView, {
    title: "Hello, World!",
    app: "hello"
});
