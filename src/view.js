var QC;
(function(QC) {
    
    var View = (function() {

        function View(execute, history, suggest) {
            QC.setLocation = this.setLocation;
            this.suggest = suggest;
            this.execute = execute;
            this.history = history;
        }

        View.prototype.addToScreen = function() {
            var styles = this.getContainerStyles();
            this.consoleContainer = document.createElement("div");
            this.consoleContainer.setAttribute("style", styles);
            document.body.appendChild(this.consoleContainer);
            this.consoleDiv = document.createElement("textarea");
            this.consoleDiv.setAttribute("readonly", "");
            this.consoleDiv.style = this.toStyle("background", "rgba(250,250,250,.87)") +
                    this.getPosition("5px", "50px", "calc(100% - 20px)", "calc(100% - 60px)");
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
            var styles = this.getPosition(0, 0, "calc(100% - 35px)", "20px", "relative") +
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
            
            if (this.isReturnKey(keyEvent)) { // Return key pressed
                this.handleReturnKey();
                return;
            } else if (this.isDownArrow(keyEvent)) { // up arrow pressed
                  this.input.value = this.history.loadLast();
            } else if (this.isUpArrow(keyEvent)) { // up arrow pressed
                this.input.value = this.history.loadNext();
            } else if (this.tabCompletion(keyEvent)) { // tab pressed
                this.handleTabCompletion(keyEvent);
            } else if (this.shouldRollbackSuggestion(keyEvent)) {
                this.input.value = this.lastValue;
            } else {
                return;
            }
            this.moveCursorToEnd();
        };
        
        View.prototype.isReturnKey = function(keyEvent) {
            return keyEvent.keyCode === 13;
        };
        
        View.prototype.isUpArrow = function(keyEvent) {
            return keyEvent.keyCode === 38;
        };
        
        View.prototype.isDownArrow = function(keyEvent) {
            return keyEvent.keyCode === 40;
        };
        
        View.prototype.requestSuggestions = function(keyEvent) {
            return keyEvent.keyCode === 32 && keyEvent.ctrlKey;  
        };
        
        View.prototype.tabCompletion = function(keyEvent) {
            return keyEvent.keyCode === 9;
        };
        
        View.prototype.shouldRollbackSuggestion = function(keyEvent) {
            return this.lastValue && keyEvent.keyCode === 90 && keyEvent.ctrlKey;  
        };
        
        View.prototype.handleReturnKey = function() {
            this.history.saveLast(this.input.value);
            try {
              this.execute.eval(this.input.value);
            } catch(error) {
              // error already logged elsewhere just catching it here so we can continue execution.
            }
            this.input.value = "";
        };
        
        View.prototype.handleTabCompletion = function(keyEvent) {
          this.lastValue = this.input.value;
          var value = this.suggest.getBestFit(this.input.value);
          this.input.value = value;
          keyEvent.preventDefault();
          this.input.focus();
        };
    
        View.prototype.setLocation = function(location) {
            QC.config.location = location;
            if (this.consoleContainer) {
                this.consoleContainer.setAttribute("style", this.getContainerStyles());
            }
        };
        
        View.prototype.moveCursorToEnd = function() {
            var _this = this;
            _this.input.focus();
            setTimeout(() => {
                _this.input.value = _this.input.value;
            }, 20);
        }
        
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
        
        return View;
    })();
    
    QC.DI.register("view", View, ["execute", "history", "suggest"]);

})(QC || (QC = {}));
