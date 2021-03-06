var QC; 
(function(QC) {
    "use strict";

    function History(storage) {
        this.storage = storage;
        this.consoleList = [];
        this.consoleIndex = 0;
        this.maxConsoleHistory = 40;
        this.loadSavedConsoleHistory();
    }
    
    History.prototype.loadSavedConsoleHistory = function() {
        var found = this.storage.retrieve("consoleHistory");
        if (found) {
            this.consoleList = JSON.parse(found);
            this.consoleIndex = this.consoleList.length - 1;
        }
    };
    
    History.prototype.saveLast = function(value) {
        // don't save empty values.
        if (!value || value === "") { return; }
        
        //  Was last command, no need to save again.
        if (this.consoleList[this.consoleList.length - 1] === value) {
            return;
        }
        
        
        if (this.consoleList.length >= QC.config.maxConsoleHistory) {
            this.consoleList.shift();
        }
        this.consoleList.push(value);
        this.consoleIndex = this.consoleList.length - 1;
        this.storage.store("consoleHistory", JSON.stringify(this.consoleList));
    };
    
    History.prototype.loadLast = function() {
        if (!this.consoleList.length) {
            // no history, just return.
            return "";
        }
        var returnObj = this.consoleList[this.consoleIndex];
        if (this.consoleList.length > this.consoleIndex) {
            this.consoleIndex += 1;
        }
        return returnObj || "";
    };
    
    History.prototype.loadNext = function() {
        if (!this.consoleList.length) {
            // no history, just return.
            return "";
        }
        var returnObj = this.consoleList[this.consoleIndex];
        this.consoleIndex = this.consoleIndex > 0 ? this.consoleIndex - 1 : 0;
        return returnObj || "";
    };

    
    QC.DI.register("history", History, ["storage"]);
    
})(QC || (QC = {}));
