var Skynet = (function() {
    var log = function(message) {
        console.log("tyler: " + Date.now() + ": " + message);
    };
    var error = function(message) {
        console.error("tyler: " + Date.now() + ": " + message);
    };

    var mergeOptions = function() {
        var retval = {};
        for(var i in arguments) {
            var x = arguments[i];
            for(var j in x) {
                retval[j] = x[j];
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

    var WindowView = new View({
        type: "WindowView",
        model: "appView",
        style: {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
        },

        init: function(model) {
            this.create('appView', this.appView); // embed model
        },

        render: function () {
            return this.$el.html(this.appView().$el);
        }
    });
    
    var applications = new Applications();

    return new View({
        type: "Skynet",
        model: "options",
        contains: "WindowView",

        style: {
            width: "100%",
            height: "100%"
        },

        init: function (options) {
        },

        registerApplication: function (name, appView, options) {
            log("Registering Application: " + name);
            applications.add(new Application(name, appView, options));
        },

        runApplication: function (name, options) {
            var application = applications.find(function (e) {
                return e.name() === name;
            });
            if(application) {
                var allOptions = mergeOptions(options, application.options());
                var app =  this.spawnApplication(application, allOptions);
                var window = this.add(new WindowView(app));
                if(options) {
                    window.$el.css(mergeOptions(options.style, application.options().style));
                } else {
                    window.$el.css(application.options().style || {});
                }
                this.render();
                return window;
            } else {
                error("Unregistered Application: " + name);
            }
        },

        spawnApplication: function(application, options) {
            log('Spawning: ' + application.name());
            var appView = application.appView();
            return new appView(options);
        },

        render: function() {
            var html = this.map(function(e) { return e.$el; });
            return this.$el.html(html);
        }
    });
})();

x = new Skynet();
$(document).ready(function () {
    $('body').html(x.$el);
    $('body').css({ margin: "0px" });
});
x.registerApplication("skynet", Skynet);

