var Skynet = (function() {
    var log = function(message) {
        this.debug && console.log("skynet: " + Date.now() + ": " + message);
    };
    var error = function(message) {
        console.error("skynet: " + Date.now() + ": " + message);
    };

    var mergeOptions = function() {
        var retval = {};
        for(var i in arguments) {
            var x = arguments[i];
            for(var j in x) {
                if(typeof retval[j] === "object") {
                    retval[j] = mergeOptions(x[j], retval[j]);
                } else {
                    retval[j] = x[j];
                }
            }
        }
        return retval;
    };

    var Application = new Model({
        type: "Application",
        init: function(name, appView, options) {
            this.create('name', name);
            this.create('appView', appView);
            this.create('options', options || {});
        }
    });

    var Applications = new Model({
        type: "Applications",
        contains: "Application"
    });

    var WindowTitleView = new View({
        type: "WindowTitleView",
        model: "appView",
        style: Styles.WindowTitleView,
        init: function (model, options, parent) {
            this.create('parent', parent);
            this.maximized = false;
        },
        init: function(model, options) {
            this.$el.text(options.title || "Untitled");
        }
    });

    var WindowBodyView = new View({
        type: "WindowBodyView",
        model: "appView",
        style: Styles.WindowBodyView,
        render: function () {
            return this.$el.html(this.appView.$el);
        }
    });

    var WindowView = new View({
        type: "WindowView",
        model: "appView",
        style: Styles.WindowView,
        init: function(model, options, parent) {
            this.$el.html(this.appView.$el);
        }
    });
    
    var applications = new Applications();

    var EmptyWindowView = new View({
        type: "Skynet"
    });

    return new View({
        type: "Skynet",
        model: "options",
        contains: "Window",

        style: {
            position: "absolute"
        },

        events: {
            mousedown: function(e) {
                while(e.target && !e.target.app) {
                    e.target = e.target.parentNode;
                }
                if(e.target) {
                    this.dragItem = e.target.app;
                    this.current(this.dragItem.parent);
                    this.dragItem.trigger('dragStart', e);
                    e.stopPropagation();
                }
            },
            mousemove: function(e) {
                if(this.dragItem)
                    this.dragItem.trigger('drag', e);
                e.stopPropagation();
            },
            mouseup: function(e) {
                if(this.dragItem) {
                    this.dragItem.trigger('dragStop', e);
                    this.dragItem = null;
                    e.stopPropagation();
                }
            },
        },

        init: function (options, parent) {
            this.create('lisp', new Lisp({
                core: "/core"
            }));
            this.options = this.options || {}; // Hack
            this.create('options', this.options); // embed model
            this.create('parent', parent);
            this.create('app');

            /*
            this.create('cols', this.options().cols || 1);
            this.create('rows', this.options().rows || 1);
            this.create('layers', this.options().layers || 1);
            this.create('layer', 0);
            var dims = { x: this.cols(),
                         y: this.rows(),
                         z: this.layers()
                       };
            this.size(dims);
            */
            if(this.options().triggerHandlers) {
                for(var trigger in this.options().triggerHandlers) {
                    var handler = this.options().triggerHandlers[trigger];
                    this.on(trigger, handler);
                }
            }

            this.create('style');
            this.on('change:style', function (e) {
                this.$el.css(this.style());
            });
            this.style(this.options().style || {});
        },

        registerApplication: function (name, appView, options) {
            log("Registering Application: " + name);
            applications.add(new Application(name, appView, options));
        },

        getApplicationOptions: function(name) {
            var application = applications.find(function (e) {
                return e.name() === name;
            });
            if(application) {
                return application.options();
            }
        },

        runApplication: function (options) {
            var name = "window";
            var application = applications.find(function (e) {
                return e.name() === name;
            });
            if(application) {
                var placement =  this.options.windowPlacer && this.options.windowPlacer({
                    width: this.$el.width(),
                    height: this.$el.height()
                });
                var allOptions = mergeOptions(application.options(), options, { style: placement });
                var app = this.spawnApplication(this, options.daemon && "daemon" || "window", allOptions );
                app.$el.css(placement || {});
                this.add(app);
                this.trigger('createWindow', this);
                this.render();
                return app;
            } else {
                error("exec: Unregistered Application: " + name);
            }
        },

        spawnApplication: function(parent, application, options) {
            if(typeof application === "string") {
                application = applications.find(function(e) {
                    return e.name() === application;
                });
            }
            if(application) {
                log('Spawning: ' + application.name());
                var appView = application.appView();
                var app = new appView(options);
                app.$el[0].app = app;
                app.parent = parent;
                app.$el.css(application.options().style || {});
                app.$el.css(options.style || {});
                app.lisp = options.lisp || this.lisp;
                this.trigger('spawnApplication', app);
                return app;
            } else {
                error("spawn: Unregistered Application: " + name);
            }
        },

        render: function () {
            var html = this.map(function(e) { return e.$el; });
            this.trigger('render', html);
            return this.$el.html(html);
        },

        placeWindow: function (window, x, y) {
            window.$el.css({
                top: y,
                left: x
            });
            this.trigger('windowPlaced', window);
        },

        sizeWindow: function (window, w, h) {
            window.$el.css({
                width: w,
                height: h
            });
            this.trigger('windowSized', window);
        },

        keyPress: function(e) {
            if(this.current()) {
                this.current().trigger('keyPress', e);
            }
        }
    });
})();

var SkynetDefaults = {
    rows: 1,
    cols: 1,
    layers: 1,

    style: {
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%"
    },

    // TODO: Doesn't work yet, should return css { top: "...px", left:
    // "...px" ... } Requires work in main.js, maybe around merge
    // options to overlay these styles over top of the existing ones.
    windowPlacer: undefined, // function (area) { return {}; },

    triggerHandlers: {
        'runApplication': function(e) {
            this.runApplication(e.value);
        }, 
        'restore': function(e) {
            if(e.target.$el.oldPos) {
                e.target.$el.parent().css(e.target.$el.oldPos);
            }
            this.trigger('restored', e.target);
        },

        'maximize': function (e) {
            var parent = e.target.$el.parent();
            var pos = parent.position();
            pos.top = 0;
            pos.left = 0;
            pos.width = "100%";
            pos.height = "100%";
            pos.border = "0px";
            var oldPos = parent.position();
            oldPos.width = parent.css("width");
            oldPos.height = parent.css("height");
            oldPos.border = parent.css("border");
            e.target.$el.oldPos = oldPos;
            parent.css(pos);
            this.trigger('maximized', e.target);
        },

        'createWindow': function (e) {
            var window = e.value;
        },

        'spawnApplication': function (e) {
            var appView = e.value;
        },

        'render': function (e) {
            var html = e.value;
        },

        'maximized': function (e) {
            var windowTitleView = e.value;
        },

        'restored': function (e) {
            var windowTitleView = e.value;
        },

        'windowPlaced': function(e) {
            var window = e.value;
        },

        'windowSized': function(e) {
            var window = e.value;
        },

        'saveCore': function(e) {
            this.lisp().saveCore(e.value);
        },

        'loadCore': function(e) {
            this.lisp().loadCore(e.value);
        }
    }
};

x = new Skynet(SkynetDefaults);

$(document).ready(function () {
    $('body').html(x.$el);
    $('body').css(Styles.Body || { margin: "0px" });
    $('body').keypress(function(e) {
        x.keyPress(e);
    });
});
x.registerApplication("skynet", Skynet);
