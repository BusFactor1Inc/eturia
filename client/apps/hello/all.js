var AppView = new View({
    type: "HelloView",
    init: function(options) {
        this.$el.html(options.text || "Goodbye, World!");
    }
});

x.registerApplication("hello", AppView, {
    title: "In the depths of Mount Doom.",
    text: "Hello, World!"
});
