var AppView = new View({
    type: "AppView",
    init: function(options) {
        this.$el.text(options.text || "Goodbye, World!");
    }
});

x.registerApplication("hello", AppView, {
    title: "In the depths of Mount Doom.",
    text: "Hello, World!"
});
