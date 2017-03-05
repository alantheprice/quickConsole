var QC;
(function(QC) {

    function View(styleUtil) {
        QC.setLocation = this.setLocation; 
//         this.inputHandler = inputHandler;
        this.styleUtil = styleUtil;
    }

    View.prototype.addToScreen = function() {
        this.consoleContainer = document.createElement("div");
        this.styleUtil.setContainerStyle(this.consoleContainer);
        document.body.appendChild(this.consoleContainer);
        this.consoleDiv = document.createElement("textarea");
        this.consoleDiv.setAttribute("readonly", "");
        this.styleUtil.set(this.consoleDiv, "textArea");
        this.consoleContainer.appendChild(this.consoleDiv);
        this.addInput();
    };
    
    View.prototype.addInput= function() {
        this.addCompletionHint();
        this.input = document.createElement("input");
        this.input.setAttribute("id", "consoleInput");
        this.input.setAttribute("type", "text");
        this.styleUtil.set(this.input, "input");
        this.consoleContainer.appendChild(this.input);
        this.addInputHandler(this.handler);
    };

    View.prototype.addInputHandler = function(handler) {
        if (this.addedHandler) {
            return;
        }
        if (!this.input) {
            this.handler = handler || this.handler;
            return;
        }
        this.addedHandler = true;
         this.input.onkeydown = (e) =>  {
            handler(e, this.input, this.completionHint);
        };
    }
    
    View.prototype.addCompletionHint = function() {
        this.completionHint = document.createElement("div");
        this.styleUtil.set(this.completionHint, "completionHint");
        this.consoleContainer.appendChild(this.completionHint);
    };
    
    View.prototype.setLocation = function(location) {
        QC.config.location = location;
        if (this.consoleContainer) {
            this.styleUtil.setContainerStyle(this.consoleContainer);
        }
    };

    View.prototype.logToScreen = function(logList) {
        if (this.consoleDiv) {
            this.consoleDiv.innerText = logList.join(this.getSeperator());
        }
    };
    
    View.prototype.getSeperator = function() {
        if (!this.logSeperator) {
            this.logSeperator = String.fromCharCode(13) +
                Array(50).join("=") +
                String.fromCharCode(13);
        }
        return this.logSeperator;
    };
    
    View.prototype.toggleConsole = function() {
        if (this.consoleContainer) {
            this.consoleContainer.remove();
            this.consoleContainer = undefined;
        } else {
            this.addToScreen();
            this.input.focus();
        }
    };
    
    View.prototype.getViewAsString = function() {
        if (!this.consoleContainer) {
            return "";
        }
        return this.consoleContainer.outerHTML;  
    };
    
    QC.DI.register("view", View, ["styleUtil"]);

})(QC || (QC = {}));
