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
        init: function(model) {
            this.create('appView', this.appView); // embed model
        },
        render: function () {
            console.log(this.appView().$el);
            return this.$el.html(this.appView().$el);
        }
    });

    return new View({
        type: "Skynet",
        model: "options",
        contains: "WindowView",

        style: {
            border: "1px solid red"
        },

        init: function (options) {
            this.create('applications', new Applications());
        },

        registerApplication: function (name, appView, options) {
            log("Registering Application: " + name);
            this.applications().add(new Application(name, appView, options));
        },

        runApplication: function (name, options) {
            var application = this.applications().find(function (e) {
                return e.name() === name;
            });
            if(application) {
                var app =  this.spawnApplication(application, mergeOptions(options, application.options()));
                var window = this.add(new WindowView(app));
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
$('body').html(x.$el);
// x.registerApplication("skynet", Skynet);

