var AppView = new View({
    type: "ImageView",
    tagName: "img",
    init: function(options) {
        this.$el.attr('src', options.uri || "broken");
    }
});

x.registerApplication("image", AppView, {
    text: "Image"
});
