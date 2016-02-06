var AppView = (function () {
    return new View({
        type: "TitleBar",
        style: Styles.TitleBar,
        events: {
            dblclick: function(e) {
                if(this.maximized) {
                    this.trigger('restore', e);
                } else {
                    this.trigger('maximize', e);
                }
                this.maximized = !this.maximized;
            }
        },

        init: function(options) {
            this.maximized = false;
            this.$el.text(options.title);

            this.on('dragStart', function (e) {
                this.dragItem = e.target.parent;
                this.dragX = e.value.clientX;
                this.dragY = e.value.clientY;
                var pos = this.dragItem.$el.position();
                this.dragDX = pos.left - this.dragX;
                this.dragDY = pos.top - this.dragY;
            });
                
            this.on('drag', function (e) {
                var pos = {
                    left: e.value.clientX + this.dragDX + "px",
                    top: e.value.clientY + this.dragDY + "px"
                };
                x.placeWindow(this.dragItem, pos.left, pos.top);
            });

            this.on('dragStop', function (e) {
                this.dragItem = null;
            });

        },
    });
})();
x.registerApplication("titlebar", AppView);
