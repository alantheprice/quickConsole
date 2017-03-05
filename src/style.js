var QC;
(function(QC) {
    "use strict";

    let styles = {
        container: {
            position: "absolute",
            background: "rgba(250, 250, 250, .87)",
            "z-index": 2000,
            overflow: "hidden",
            color: "#404040"
        },
        textArea: {
            position: "absolute",
            background: "rgba(250, 250, 250, 0.87)",
            border: "none",
            rect: "0 50px 100% calc(100% - 60px)"
        },
        input: {
            position: "relative",
            rect: "0 0 calc(100% - 22px) 20px",
            border: "1px solid rgba(90, 90, 90, 0.4);",
            padding:"4px",
            "border-radius": "5px",
            margin:"1%",
            "z-index": 2,
            font: "1em arial",
            outline: "none",
            "background-color": "transparent"
        },
        completionHint: {
            position: "absolute",
            rect: "0 0 80% 20px",
            "z-index": 2,
            color: "rgba(40, 40, 40, 0.7)",
            font: "1em arial",
            "line-height": "20px",
            margin: "1%",
            padding: "6px"
        },
        left: {
            rect: "0 0 50% 100%"
        },
        right: {
            rect: "50% 0 50% 100%"
        },
        top: {
            rect: "0 0 100% 50%"
        },
        bottom: {
            rect: "0 50% 100% 50%"
        },
        full: {
            rect: "0 0 100% 100%"
        }
    };

    QC.DI.registerStatic("style", styles);

})(QC || (QC = {}));
