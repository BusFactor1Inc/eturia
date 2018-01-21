var AppView = (function () {
    return new View({
        type: "AudioPlayerView",
        init: function(options) {
            this.create('audio');
            this.create('playlist');
            
            this.create('playButton', x.spawnApplication(this, "button", {
                text: "Play",
                click: this.play.bind(this)
            }));

            this.create('stopButton', x.spawnApplication(this, "button", {
                text: "Stop",
                click: this.stop.bind(this)
            }));

            this.create('nextButton', x.spawnApplication(this, "button", {
                text: "Next",
                click: this.next.bind(this)
            }));

            this.on('change:playlist', function (e) {
                $.ajax({
                    url: this.playlist(),

                    success: function (data) {
                        this.clear(true);
                        data = data.split('\n');
                        while(data.length > 0) {
                            var i = Math.floor(Math.random()*data.length);
                            this.debug && console.log("audioPlayer: ", data.length, data[i]);
                            this.add(data[i], true);
                            data.splice(i, 1);
                        }
                        this.current(0);
                    }.bind(this),

                    failure: function (e) {
                        alert("audioPlayer: cannot download playlist!");
                    }
                });
            });

            this.on('change:current', function () {
                this.stop();
                this.play();
                this.render();
            });

            this.playlist(options.playlist || "music/playlist");
        },
        
        play: function () {
            console.log('audioPlayer: current: ', this.current());

            var audio = new Audio(this.current());
            audio.addEventListener('ended',function(){
                this.next();
            }.bind(this));
            this.audio(audio, true);
            audio.play();
            this.playing = true;
        },
        
        stop: function () {
            this.audio().pause()
            this.audio(undefined, true);
            this.playing = false;
        },

        render: function () {
            var html = [ this.playButton().$el,
                         this.stopButton().$el,
                         this.nextButton().$el ];
            return this.$el.html(html);
        }
    })
})();
    
x.registerApplication("audioplayer", AppView, {
    title: "Audio Player"
});
