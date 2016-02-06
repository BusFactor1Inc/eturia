var AppView = (function () {
    return new View({
        type: "Window",
        model: "options",
        style: Styles.Window,
        init: function(options, parent) {
            var appPlace = 0;
            if(!options.noTitleBar) {
                this.create('grid', x.spawnApplication(this, "grid", {
                    rows: 2
                }));
                this.grid().setColRow(0, 0, 
                                      this.create('titleBar', 
                                                  x.spawnApplication(this, 
                                                                     "titlebar",
                                                                     options.appOptions ||
                                                                     options)));
                appPlace = 1;
            } else {
                this.create('grid', x.spawnApplication(this, "grid"));
            }
            this.grid().setColRow(0, appPlace, 
                                  this.create('app', 
                                              x.spawnApplication(this, 
                                                                 options.app,
                                                                 options.appOptions ||
                                                                 options)));
                
            this.options.width && this.$el.width(this.options.width);
            this.options.height && this.$el.height(this.options.height);
            this.on('change', this.render);
        },

        render: function () {
            return this.$el.html(this.grid().$el);
        }
    });
})();

x.registerApplication("window", AppView, {
    title: "Hello, World!",
    app: "hello"
});
