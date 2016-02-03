var hello = x.runApplication("hello", { text: "Don't say goodbye.",
                                        style: {
                                            top: "100px",
                                            left: "200px",
                                            width: "320px",
                                            height: "240px",
                                            border: "2px solid black",
                                        }});
var x2 = x.runApplication("skynet");
var hello2 = x2.appView().runApplication("hello", { text: "Don't say goodbye 2.",
                                                    style: {
                                                        top: "300px",
                                                        left: "400px",
                                                        width: "240px",
                                                        height: "320px",
                                                        border: "2px solid red",
                                                    }});

