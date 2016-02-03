var AppView = new View({
    type: "AppView",
    init: function(options) {
        this.$el.text(options.text || "Goodbye, World!");
    }
});

x.registerApplication("hello", AppView, {
    style: {
        title: "Hello",
        text: "Hello, World!",
        width: "320px",
        height: "240px"
    }
});
