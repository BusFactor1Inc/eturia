var AppView = new View({
    type: "HelloView",
    tagName: "iframe",
    init: function(options) {
        this.create('uri');
        this.on('change:uri', function (e) {
            this.$el.attr('src', this.uri());
            this.$el.attr('frameborder', 0);
            debugger
            this.$el.attr('width',
                          options.style &&
                          options.style.width  || "600px")
            this.$el.attr('height',
                          options.style &&
                          options.style.height || "600px")
        });
        this.uri(options.uri);
    }
});

x.registerApplication("iframe", AppView, {
    title: "IFrame.",
});
