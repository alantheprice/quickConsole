var QC; 
(function(QC) {
    
    var Setup = (function() {
        
        // view is recursive, we need to solve this
        function Setup(log, view) {
            this.log = log;
            this.view = view;
            QC.init = this.init;
            this.captureNativeConsole();
            this.registered = false;
            this.overrideNativeConsole();
            this.toggleConsoleTimeout;
        }
        
        Setup.prototype.overrideNativeConsole = function() {
            console.log = msg => this.log.write("log", msg);
            console.error = msg => this.log.write("error", msg);
            console.warn = msg => this.log.write("warn", msg);
            console.info = msg => this.log.write("info", msg);
            console.clear = this.log.clear;
            window.onerror = (errorMsg, url, lineNumber, column) => this.log.error(errorMsg, url, lineNumber, column);
        };
        
        Setup.prototype.captureNativeConsole = function() {
            QC.innerConsole = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info,
                clear: console.clear,
                onError: window.onerror
            };
        };
        
        Setup.prototype.registerToggleHandler = function(obj) {
            if (!this.registered) {
                this.registerKeyHandler(window);
                this.registered = true;
            }
            if (!obj) {
                return;
            }
            this.registerKeyHandler(obj);
        };
        
        Setup.prototype.registerKeyHandler = function(obj) {
            var elem = obj || window;
            var currentHandler = elem.onkeydown;
            elem.onkeyup = (e) => {
                this.checkForConsoleToggle(e);
              if (currentHandler) {
                  currentHandler(e);
              }
            };
        };
        
        Setup.prototype.checkForConsoleToggle = function(e) {
            // ctrl + alt + shift + d to open console
            if (e.shiftKey && e.altKey && e.ctrlKey && e.keyCode === 68) {
                clearTimeout(this.toggleConsoleTimeout);
                this.toggleConsoleTimeout = setTimeout(() => {
                    this.view.toggleConsole();
                }, 200);
                return true;
            }
            return false;
        };
        
        return Setup;
        
    })();
    
    QC.DI.register("setup", Setup, ["log", "view"]);

})(QC || (QC = {}));