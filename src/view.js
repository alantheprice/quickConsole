var QC;
(function(QC) {
    
    var View = (function() {

        function View(execute, history) {
            QC.setLocation = this.setLocation;
            this.execute = execute;
            this.history = history;
        }

        View.prototype.addToScreen = function() {
            var styles = this.getContainerStyles();
            this.consoleContainer = document.createElement("div");
            this.consoleContainer.setAttribute("style", styles);
            document.body.appendChild(this.consoleContainer);
            this.consoleDiv = document.createElement("div");
            this.consoleDiv.style = this.getPosition("0", "50px", "100%", "90vh");
            this.consoleContainer.appendChild(this.consoleDiv);
            this.addInput();
        };
        
        View.prototype.getContainerStyles = function() {
            return this.getConsolePosition() +
                this.toStyle("background", "rgba(250,250,250,.87)") +
                this.toStyle("z-index", 2000) +
                this.toStyle("overflow", "auto") + 
                this.toStyle("color", "#404040");
        };
        
        View.prototype.addInput= function() {
            this.input = document.createElement("input");
            var styles = this.getPosition(0, 0, "97%", "20px", "relative") +
                "border:1px solid rgba(90,90,90,.7);" +
                "padding:5px;margin:1%;z-index: 2; outline: none;";
            this.input.setAttribute("id", "consoleInput");
            this.input.setAttribute("type", "text");
            this.input.setAttribute("style", styles);
            this.input.onkeydown = (e) => this.updateInputText(e);
            this.consoleContainer.appendChild(this.input);
        };
        
        View.prototype.updateInputText = function(keyEvent) {
            // loading when needed to make sure we don't have recursive dependencies.
            if (QC.DI.load("setup").checkForConsoleToggle(keyEvent)) {
                return;
            } 
            
            if (keyEvent.keyCode === 13) {
                this.history.saveLast(this.input.value);
                try {
                  this.execute.eval(this.input.value);
                } catch(error) {
                  // error already logged elsewhere just catching it here so we can continue execution.
                }
                this.input.value = "";
            } else if (keyEvent.keyCode === 38) { // up arrow pressed
                this.input.value = this.history.loadLast();
            } else if (keyEvent.keyCode === 40) { // up arrow pressed
                this.input.value = this.history.loadNext();
            }
        };
    
        View.prototype.setLocation = function(location) {
            QC.config.location = location;
            if (this.consoleContainer) {
                this.consoleContainer.setAttribute("style", this.getContainerStyles());
            }
        };
        
        View.prototype.getConsolePosition = function() {
            switch (QC.config.location) {
                case QC.LOCATIONS.LEFT:
                    return this.getPosition(0, 0, "50%", "100%");
                case QC.LOCATIONS.RIGHT:
                    return this.getPosition("50%", 0, "50%", "100%");
                case QC.LOCATIONS.TOP:
                    return this.getPosition(0, 0, "100%", "50%");
                case QC.LOCATIONS.BOTTOM:
                    return this.getPosition(0, "50%", "100%", "50%");
                default:
                    return this.getPosition(0, 0, "100%", "100%");
            }
        };
        
        View.prototype.getPosition = function(left, top, width, height, position) {
            // use default of absolute if position unspecified
            var positionStyle = this.toStyle("position", position ? position : "absolute");
            var style = this.getRect(left, top, width, height).join(" ");
            return style + positionStyle;
        };
        
        View.prototype.getRect = function(left, top, width, height) {
            return [
                this.toStyle("left", left),
                this.toStyle("top", top),
                this.toStyle("width", width),
                this.toStyle("height", height)
                ];
        };
        
        View.prototype.toStyle = function(name, value) {
            return name + ":" + value + ";";
        };
        
        View.prototype.logToScreen = function(logList) {
            if (this.consoleDiv) {
                this.consoleDiv.innerText = logList.join(String.fromCharCode(13));
            }
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
        
        return View;
    })();
    
    QC.DI.register("view", View, ["execute", "history"]);

})(QC || (QC = {}));
