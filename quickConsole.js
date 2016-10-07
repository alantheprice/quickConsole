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

var QC; 
(function(QC) {
    
    var DI = (function () {
        
        function DI() {
            this.statics = [];
            this.buildable = [];
            this.registered = [];
        }
        
        DI.prototype.register = function(name, func, dependencies) {
            this.buildable[name] = {
                name: name, 
                func: func, 
                dependencies: (dependencies || [])
            };
            this.registered.push(this.buildable[name]);
        };
        
        DI.prototype.load = function(name) {
            var loaded = this.statics[name];
            if (!loaded) {
                loaded = this.build(name);
                this.statics[name] = loaded;
            }
            return loaded;
        };
        
        DI.prototype.build = function(name) {
            var obj = this.buildable[name];
            if (!obj) {
                throw new Error("'" + name + "'  has not been registered!");
            }
            var dependencies = [];
            if (obj.dependencies && obj.dependencies.length) {
                obj.dependencies.forEach( depName => {
                    var dep = this.load(depName);
                    dependencies.push(dep);
                });
            }
            //  FROM: http://stackoverflow.com/a/28244500  cr
            return new (obj.func.bind.apply(obj.func, [null].concat(dependencies)))();
            //return obj.func.apply(obj.func, dependencies);

        };
        
        DI.prototype.getDependencyMap = function() {
            return this.registered.map(build => {
                var deps = this.getDependencies(build.dependencies, [build.name], 2);
                return build.name + ":" + "\n" + deps;
            }).join("\n");
        };
        
        DI.prototype.getDependencies = function(deps, referencers, insetDepth) {
            if ((!deps || !deps.length) && insetDepth === 2) {
                return Array(insetDepth).join("--") + "No Dependencies \n";
            }
            return deps.map(dep => {
                if (referencers.indexOf(dep) > -1) {
                    return Array(insetDepth).join("--") + "Recursive depency on: " + dep + "\n";
                }
                var ancestors = referencers.slice(0);
                ancestors.push(dep);
                return Array(insetDepth).join("--") + dep + "\n" + 
                    this.getDependencies(this.buildable[dep].dependencies, ancestors, insetDepth +1);
            }).join("");
        };
        
        return DI;
        
    })();
    
    // instantiating directly since it is needed to build everything else.
    QC.DI = new DI();
        
})(QC || (QC = {}));

var QC;
(function(QC) {
    
    var Execute = (function() {
        
        function Execute(log) {
            this.clearFunctionsOptions = ["clear();", "clear()", "Clear();", "Clear()"];
            this.log = log;
            this.executor = this.executeEval;
        }
        
        Execute.prototype.eval = function(evalString) {
            if (this.requestingClear(evalString)) {
                this.log.clear();
                return;
            }
            this.executor(evalString);
        };

        Execute.prototype.requestingClear = function(evalString) {
            return this.clearFunctionsOptions.indexOf(evalString) > -1;
        };
    
        Execute.prototype.executeEval = function(evalString) {
            var response;
            try{
                response = eval(evalString);
            } catch(error) {
                if (error.message && error.message.indexOf("Refused to evaluate a string as JavaScript because 'unsafe-eval'") > -1) {
                  this.log.write("log", "Eval is not allowed on this platform, defaulting to simple execution which only allow direct function calls with primitives as params");
                  this.executor = this.executeSafe;
                  this.executeSafe(evalString);
                }
                this.log.write("error", error.message);
            }
            this.handleExecuteResponse(response);
        };
        
        Execute.prototype.executeSafe = function(inputValue) {
          if (inputValue.indexOf("(") > -1) {
            var parts = inputValue.split("(");
            var funcName = parts[0];
            var params = (parts && parts.length) ? parts[1].split(")")[0].split(",") : [];
            params = params.map((val) => this.parseParam(val))
                .filter((val) => {return !!val;});
            this.executeFunction(funcName, params);
          } else {
            this.logObject(inputValue);
          }
        };

        Execute.prototype.parseParam = function(val) {
            if (!val || !val.length) {
                return null;
            }
            if (this.isNumber(val)) {
                
                return (val.indexOf(".") > -1) ? parseFloat(val) : parseInt(val);
            }
            else {
                return this.sanitizeString(val);
            }
        };

        Execute.prototype.isNumber = function (str) {
            return !isNaN(parseFloat(str)) && isFinite(str);
        };

        Execute.prototype.sanitizeString = function (str) {
            if (!str.length) {
                return str;
            }
            str = str.trim();
            if (str[0] === "\"" || str[0] === "'") {
                return this.sanitizeString(str.substr(1));
            }
            if (str[str.length -1] === "\"" || str[str.length -1] === "'") {
                return this.sanitizeString(str.slice(0, -1));
            }
            return str;
        };
        
        Execute.prototype.executeFunction = function(funcName, params) {
            var func = window;
            var context = window;
            var functionName = "window";
            funcName.split(".").forEach(name => {
                if (!func[name]) {
                   console.error(name + " does not exist on object: " + functionName);
                   return;
                }
                context = func;
                functionName += ("." + name);
                func = func[name];
            });
            var response = func.apply(context, params);
            this.handleExecuteResponse(response);
        };
        
        Execute.prototype.logObject = function(objName) {
            var context = window;
            var tmpName = "window";
            objName.split(".").forEach(name => {
                if (!context[name]) {
                   console.error(name + " does not exist on object: " + tmpName);
                   return;
                }
                tmpName += ("." + name);
                context = context[name];
            });
            this.handleExecuteResponse(context);
        };
        
        Execute.prototype.handleExecuteResponse = function(response) {
            if (!response) {
                return;
            }
            // check to see if it is a promise
            if (response.then) {
                response.then(returnVal => {
                    this.log.write("log", returnVal);
                });
                return;
            }
            this.log.write("log", response);
        };
        
        return Execute;
        
    })();
    
    QC.DI.register("execute", Execute, ["log"]);

    
})(QC || (QC = {}));

var QC;
(function(QC) {

    var Format = (function() {

        function Format() {
            this.spacer = "_";
        }

        Format.prototype.message = function(msg) {
            if (typeof msg === "string") {
                return msg;
            } else if (this.isElement(msg)) {
                return this.formatElement(msg);
            } else {
                return this.formatJSON(msg);
            }
        };

        Format.prototype.formatElement = function(msg) {
            var prefix = "Element: Html" + String.fromCharCode(13);
            var offset = 1;
            return prefix + msg.outerHTML.replace(/(?:\r\n|\r|\n)/g, "#")
                .replace(/>/g, ">#")
                .replace(/</g, "<#")
                .replace(/##/g, "#")
                .split("#")
                .map(val => {
                    val = val.trim();
                    if (val[1] && val[1] === "/" && offset > 2) {
                        offset = offset - 2;
                        return this.getSpacer(offset) + val;
                    } else if (val[0] && val[0] === "<" && val[1] !== "i") {
                        var tempOffset = offset;
                        offset = offset + 2;
                        return this.getSpacer(tempOffset) + val;
                    } else {
                        return this.getSpacer(offset) + val;
                    }
                })
                .join(String.fromCharCode(13));
        };

        Format.prototype.getSpacer = function(num) {
            return Array(num * 2).join(this.spacer);
        };

        Format.prototype.isElement = function(obj) {
            return typeof obj.outerHTML !== "undefined";
        };
        
        Format.prototype.formatJSON = function(msg) {
            var returnObj = "";
            try {
                return JSON.stringify(msg, null, 4);
            } catch(error) {
                return "Failed to serialize object";
            }
        };

        return Format;

    })();
    
    QC.DI.register("format", Format);

})(QC || (QC = {}));
var QC; 
(function(QC) {
    
    var History = (function() {
        
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
        
        return History;
        
    })();
    
    QC.DI.register("history", History, ["storage"]);
    
})(QC || (QC = {}));

var QC;
(function(QC) {
    
    var Log = (function() {
        
        function Log(format, storage) {
            this.format = format;
            this.storage = storage;
            this.logList = [];
        }
        
        Log.prototype.write = function(logName, msg) {
            var message = logName.toUpperCase() + ": " + this.format.message(msg);
            this.addToLogList(message);
            // loading view when needed so we don't have a recursive dependency
            var view = QC.DI.load("view");
            view.logToScreen(this.logList);
            if (!QC.innerConsole[logName] || QC.config.overrideNativeCalls) {
                return;
            }
            QC.innerConsole[logName](msg);
        };
        
        Log.prototype.error = function(errorMsg, url, lineNumber, column) {
            this.write("error", ["errorMsg: ", errorMsg, "url: ", url, "lineNumber: ", lineNumber, "column: ", column].join("\n"));
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
        
        return Log;
    })();
    
    QC.DI.register("log", Log, ["format", "storage"]);    

})(QC || (QC = {}));
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
var QC;
(function(QC) {
    
    var Storage = (function() {
        
        function Storage() {
        }
        
        Storage.prototype.store = function(key, value) {
            if (!this.useLocalStorage()) {
                return false;
            }
            localStorage.setItem(key, value);
            return true;
        };
        
        Storage.prototype.retrieve = function(key, defaultValue) {
            if (!this.useLocalStorage()) {
                return defaultValue;
            }
            var foundValue = localStorage.getItem(key);
            if (typeof foundValue === "undefined" && typeof foundValue !== "undefined") {
                return defaultValue;
            }
            return foundValue;
        };
        
        Storage.prototype.useLocalStorage = function() {
            //TODO: cache value.
            var hasLocalStorage = false;
            try {
              hasLocalStorage = typeof localStorage !== "undefined";
            } catch(error) {
              // no need to catch anything, just use local storage if available.
            }
            return hasLocalStorage;
        };
        
        return Storage;
        
    })();
    
    QC.DI.register("storage", Storage, []);

})(QC || (QC = {}));
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
