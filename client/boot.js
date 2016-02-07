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
/*
var hello2 = x.runApplication({ app: "hello",
                                text: "Don't say goodbye 2.",
                                style: {
                                    top: "200px",
                                    left: "200px"
                                }});
//x.placeWindow(hello2, "200px", "200px");
//x.sizeWindow(hello2, "240px", "240px");
*/
var hello = x.runApplication({ app: "hello",
                               title: "Testing",
                               text: "Don't say goodbye.",
                               style: {
                                   top: "100px",
                                   left: "200px"
                               }});

//x.placeWindow(hello, 50, 50);
//x.sizeWindow(hello, "128px", "128px");
var lisp = new Lisp({
    core: "/core" 
});
console.log(lisp.exec("(defmacro double (x) `(+ ,x ,x))")); 
console.log(lisp.bjs("lisp.exec('(defmacro square (x) `(* ,x ,x))'); "));

x.runApplication({ app: "notebook",
                   title: "Notebook Title",
                 });

x.runApplication({app:"cell",
                  title: "Cell",
                  blink: true
                 });
var terminal = x.runApplication({app:"terminal",
                                 title: "Registry",
                                 style: {
                                     top: "300px",
                                     left: "20px"
                                 }
                                });
var y = terminal.grid().getColRow(0, 1, true).grid()
console.log(y.getColRow(0,0));
terminal.app().clearScreen();
x.current(terminal);


