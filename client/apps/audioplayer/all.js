var AppView = (function () {
    return new View({
        type: "AudioPlayerView",
        tagName: "audio controls",
        init: function(options) {
            this.create('playlist');
            
            this.on('change:playlist', function (e) {
                $.ajax({
                    url: this.playlist(),

                    success: function (data) {
                        this.clear(true);
                        data = data.split('\n');

                        while(data.length > 0) {
                            var i = Math.floor(Math.random()*data.length);
                            this.debug && console.log("audioPlayer: ", data.length, data[i]);
                            var source = $('<source>');
                            source.attr('src', data[i]);
                            data.splice(i, 1);
                            this.$el.append(source);
                        }
                    }.bind(this),

                    failure: function (e) {
                        alert("audioPlayer: cannot download playlist!");
                    }
                });
            });

            this.playlist(options.playlist || "music/playlist");
        }
    })
})();
    
x.registerApplication("audioplayer", AppView, {
    title: "Audio Player"
});
