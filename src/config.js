var QC; 
(function(QC) {

    var setup = false;
    
    QC.LOCATIONS = {
        LEFT: "left", 
        RIGHT: "right", 
        TOP: "top", 
        BOTTOM: "bottom", 
        FULL: "full"
    };
    
    QC.config = {
       overrideNativeCalls: true,
       location: QC.LOCATIONS.LEFT,
       maxMessageCount: 50,
       maxConsoleHistory: 40
    };
    
    QC.init = (options, keyhandler) => {
        //TODO: something here with registering the keyhandler.
        QC.config.location = options.location || QC.config.location;
        QC.overrideNativeCalls = options.overrideNativeCalls || QC.config.overrideNativeCalls;
        if (!setup) {
            var st = QC.DI.load("setup");
            st.registerKeyHandler(keyhandler);
            setup = true;
        }
    };

})(QC || (QC = {}));
var quickConsole = QC;
