/*
var x2 = x.runApplication({
    app: "skynet",
    title: "Skynet",
    style: {
        position: "absolute",
        top: "0px",
        left: "0px",
        width: "100%",
        height: "100%",
    }
    });

x.placeWindow(x2, 100, 100);
x.sizeWindow(x2, "320px", "240px");
*/
/*
var hello2 = x2.trigger('runApplication', { app: "hello",
                                            text: "Don't say goodbye 2.",
                                            style: {
                                                top: "100px",
                                                left: "100px",
                                                width: "240px",
                                                height: "320px",
                                                border: "2px solid red",
                                            }});
*/
//x.placeWindow(hello2, "200px", "200px");
//x.sizeWindow(hello2, "240px", "240px");

//x.placeWindow(hello, 50, 50);
//x.sizeWindow(hello, "128px", "128px");
var notebook = x.runApplication({ app: "notebook",
                                  title: "Listener",
                                  height: "900px",
                                  style: {
                                      top: "25px",
                                      left: "20px",
                                      maxWidth: "820px",
                                  }
                                });

/*
x.runApplication({app:"cell",
                  title: "Cell",
                  blink: true
                 });
*/
/*
var terminal = x.runApplication({app:"terminal",
                                 title: "Registry",
                                 style: {
                                     top: "300px",
                                     left: "20px"
                                 }
                                });
var y = terminal.grid().getColRow(0, 1, true).grid()
*/
x.current(notebook);
x.runApplication({ app: "audioplayer",
                   appOptions: {
                       title: "Eturia Music",
                       playlist: "music/playlist"
                   },
                   style: {
                       top: "25px",
                       left: "845px"
                   }
                 });

x.runApplication({ app: "iframe",
                   appOptions: {
                       title: "The Order of Symbols",
                       uri: 'the-order-of-symbols.txt',
                   },
                   style: {
                       top: "100px",
                       left: "845px"
                   }
                 });

