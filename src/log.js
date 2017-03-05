var QC;
(function(QC) {

    function Log(format, storage) {
        this.format = format;
        this.storage = storage;
        this.logList = [];
    }
    
    Log.prototype.write = function(logName, msg) {
        var message = logName.toUpperCase() + ": " + this.format.message(msg, this.getView().getViewAsString());
        this.addToLogList(message);
        // loading view when needed so we don't have a recursive dependency
        this.getView().logToScreen(this.logList);
        if (!QC.innerConsole[logName] || QC.config.overrideNativeCalls) {
            return;
        }
        QC.innerConsole[logName](msg);
    };
    
    Log.prototype.getView = function() {
        if (!this.view) {
            this.view = QC.DI.load("view");
        }
        return this.view;
    };
    
    Log.prototype.error = function(errorMsg, url, lineNumber, column) {
        this.write("error", [
                "errorMsg: ", errorMsg,
                "url: ", url, 
                "lineNumber: ", lineNumber, 
                "column: ", column
            ].join("\n"));
        if (QC.innerConsole.onError) {
            QC.innerConsole.onError(errorMsg, url, lineNumber, column);
        }
    };
    
    Log.prototype.clear = function() {
        this.storage.store("consoleMsg", JSON.stringify(this.logList));
        if (QC.innerConsole.clear) {
            QC.innerConsole.clear();
        }
        this.logList = [];
        var view = QC.DI.load("view");
        view.logToScreen(this.logList);
    };
    
    Log.prototype.addToLogList = function(value) {
        if (this.logList.length >= QC.config.maxMessageCount) {
            this.logList.pop();
        }
        this.logList.unshift(value);
    };
    
    QC.DI.register("log", Log, ["format", "storage"]);    

})(QC || (QC = {}));