var AppView = new View({
    type: "ButtonView",
    tagName: "button",

    events: {
        click: function (e) {
            var click = this.click();
            click && click(e);
            e.stopPropagation();
        }
    }, 

    init: function(options) {
        console.log(options);
        this.create('click', options.click);
        this.create('text', options.text || "Button");

        this.on('change:text', this.render);
    },

    render: function () {
        return this.$el.text(this.text());
    }
});

x.registerApplication("button", AppView, {
});
