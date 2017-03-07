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
    "use strict";
   
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

    DI.prototype.registerStatic = function(name, staticVar) {
        this.statics[name] = staticVar;
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
        let obj = this.buildable[name];
        if (!obj) {
            throw new Error("'" + name + "'  has not been registered!");
        }
        let dependencies = [];
        if (obj.dependencies && obj.dependencies.length) {
            obj.dependencies.forEach( depName => {
                let dep = this.load(depName);
                dependencies.push(dep);
            });
        }
        //  FROM: http://stackoverflow.com/a/28244500 
        return new (obj.func.bind.apply(obj.func, [null].concat(dependencies)))();

    };
    
    DI.prototype.getDependencyMap = function() {
        return this.registered.map(build => {
            if (!build) {
                return "";
            }
            let deps = this.getDependencies(build.dependencies, [build.name], 2);
            return build.name + ":" + "\n" + deps;
        }).join("\n");
    };
    
    DI.prototype.getDependencies = function(deps, referencers, insetDepth) {
        if ((!deps || !deps.length)) {
            if (insetDepth < 2) {
                return Array(insetDepth).join("--") + "No Dependencies \n";
            }
            return "";
        }
        return deps.map(dep => {
            if (referencers.indexOf(dep) > -1) {
                return Array(insetDepth).join("--") + "Recursive depency on: " + dep + "\n";
            }
            var ancestors = referencers.slice(0);
            ancestors.push(dep);
            let buildable = this.buildable[dep] || {};
            return Array(insetDepth).join("--") + dep + "\n" + 
                this.getDependencies(buildable.dependencies, ancestors, insetDepth +1);
        }).join("");
    };

    
    // instantiating directly since it is needed to build everything else.
    QC.DI = new DI();
        
})(QC || (QC = {}));

var QC;
(function(QC) {
    "use strict";
    
    function Execute(log) {
        this.executor = this.executeEval;
    }
    
    Execute.prototype.eval = function(evalString) {
        return this.executor(evalString);
    };

    Execute.prototype.executeEval = function(evalString) {
        return new Promise((resolve, reject) => {
            var response;
            try{
                response = eval(evalString);
            } catch(error) {
                if (error.message && error.message.indexOf("Refused to evaluate a string as JavaScript because 'unsafe-eval'") > -1) {
                    resolve({name: "log", value: "Eval is not allowed on this platform, defaulting to simple execution which only allows direct function calls with primitives as params"});
                    this.executor = this.executeSafe;
                    this.executeSafe(evalString);
                }
                return resolve({name: "error", value: error.message});
            }
            this.unwrapResponse(response)
            .then((unwrapped) => {
                resolve(unwrapped);
            })
        });
    };
    
    Execute.prototype.executeSafe = function(inputValue) {
        if (inputValue.indexOf("(") > -1) {
            var parts = inputValue.split("(");
            var funcName = parts[0];
            var params = (parts && parts.length) ? parts[1].split(")")[0].split(",") : [];
            params = params.map((val) => this.parseParam(val))
                .filter((val) => {return !!val;});
            return this.executeFunction(funcName, params);
        } else {
            return this.getObject(inputValue);
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
        return this.unwrapResponse(response);
    };
    
    Execute.prototype.getObject = function(objName) {
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
        return this.unwrapResponse(context);
    };

    Execute.prototype.unwrapResponse = function (response) {
        return new Promise((resolve, reject) => {
            response = response || "undefined";
            // if it is a promise, unwrap it.
            if (response.then) {
                response.then(returnVal => {
                    resolve({name: "log", value: returnVal});
                })
            }
            resolve({name: "log", value: response});
        });
    }
    
    QC.DI.register("execute", Execute, []);

    
})(QC || (QC = {}));

var QC;
(function(QC) {
    "use strict";

    function Format() {
        this.spacer = String.fromCharCode(32);
    }

    Format.prototype.message = function(msg, viewHtml) {
        if (typeof msg === "string") {
            return msg;
        } else if (this.isElement(msg)) {
            return this.formatElement(msg, viewHtml);
        } else {
            return this.formatJSON(msg);
        }
    };

    Format.prototype.formatElement = function(msg, removeChars) {
        var prefix = "Element: Html" + String.fromCharCode(13) + Array(25).join("-");
        var offset = 0;
        var html = msg.outerHTML;
        if (removeChars) {
            html = html.replace(removeChars, "<quick-console>[...]</quick-console>");
        }
        return prefix + html.replace(/(?:\r\n|\r|\n)/g, "#")
            .replace(/>/g, ">#")
            .replace(/</g, "#<")
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
        try {
            return JSON.stringify(msg, null, 4);
        } catch(error) {
            return "Failed to serialize object";
        }
    };

    QC.DI.register("format", Format);

})(QC || (QC = {}));
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

var QC;
(function(QC) {

    
    function InputHandler(execute, history, suggest, log, view) {
        this.clearFunctionsOptions = ["clear();", "clear()", "Clear();", "Clear()"];
        this.execute = execute;
        this.history = history;
        this.suggest = suggest;
        this.log = log;
        this.view = view;

        this.view.addInputHandler((e, i, c) => {
            return this.updateInputText(e, i, c);
        })
    }
    
    InputHandler.prototype.updateInputText = function(keyEvent, input, completionHint) {
        // loading when needed to make sure we don't have recursive dependencies.
        if (QC.DI.load("setup").checkForConsoleToggle(keyEvent)) {
            return;
        }
        switch(keyEvent.key) {
            case "Enter":
                this.handleReturnKey(input);
                break;
            case "ArrowDown":
                input.value = this.history.loadLast();
                break;
            case "ArrowUp":
                input.value = this.history.loadNext();
                break;
            case "Tab":
                this.handleTabCompletion(keyEvent, input);
                break;
            case "z":
                if (!keyEvent.ctrlKey) { return; }
                input.value = this.lastValue;
                break;
            default:
                this.updateSuggestionsAfterTimeout(input, completionHint);
                return;
        }
        this.moveCursorToEnd(input, completionHint);
    };

    InputHandler.prototype.requestingClear = function(evalString) {
        return this.clearFunctionsOptions.indexOf(evalString) > -1;
    };
    
    InputHandler.prototype.handleReturnKey = function(input) {
        this.history.saveLast(input.value);
        if (this.requestingClear(input.value)) {
            this.log.clear();
            input.value = "";
            return;
        }
        try {
            this.execute.eval(input.value)
                .then(response => {
                    this.log.write(response.name, response.value);
                });
        } catch(error) {
            // error already logged elsewhere just catching it here so we can continue execution.
        }
        input.value = "";
    };
    
    InputHandler.prototype.handleTabCompletion = function(keyEvent, input) {
        this.lastValue = input.value;
        var suggestion = this.suggest.getSuggestion(input.value);
        input.value = suggestion.getAutoCompetion();
        keyEvent.preventDefault();
        input.focus();
    };
            
    InputHandler.prototype.moveCursorToEnd = function(input, hint) {
        input.focus();
        hint.innerText = "";
        setTimeout(() => {
            input.value = input.value;
        }, 20);
    };
    
    InputHandler.prototype.updateSuggestionsAfterTimeout = function(input, hint) {
        clearTimeout(this.suggestionTimeoutId);
        
        this.suggestionTimeoutId = setTimeout(() => {
            this.populateHint(hint, this.suggest.getSuggestion(input.value));
        }, 50);
    };
    
    InputHandler.prototype.populateHint = function(hint, suggestion) {
        if (!suggestion.suggestions) {
            return;
        }
        hint.innerText = suggestion.getAutoCompetion();
    };
    
    QC.DI.register("inputHandler", InputHandler, ["execute", "history", "suggest", "log", "view"]);

})(QC || (QC = {}));
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
var QC; 
(function(QC) {
    "use strict";

    // view is recursive, we need to solve this
    function Setup(log, view, inputHandler) {
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
    
    QC.DI.register("setup", Setup, ["log", "view", "inputHandler"]);

})(QC || (QC = {}));
var QC;
(function(QC) {
    "use strict";
            
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

    
    QC.DI.register("storage", Storage, []);

})(QC || (QC = {}));
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
        "text-area": {
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
        "completion-hint": {
            position: "absolute",
            rect: "0 0 80% 20px",
            "z-index": 2,
            color: "rgba(40, 40, 40, 0.7)",
            font: "1em arial",
            "line-height": "20px",
            margin: "1%",
            padding: "5px"
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

var QC;
(function(QC) {
    "use strict";

    function StyleUtil(style) {
        this.style = style;
    }

    StyleUtil.prototype.getCssString = function getCssString() {
        let keys = Object.keys(this.style);
        return keys.map((key) => {
            return [".qc-", key, " { ", this.get(key), " }"].join("");
        }).join("\n");
    };

    StyleUtil.prototype.get = function get(styleKey) {
        return this.toStyle(this.style[styleKey]);
    };

    StyleUtil.prototype.set = function set(element, styleKey) {
        element.setAttribute("style", this.get(styleKey));  
    };

    StyleUtil.prototype.toStyle = function toStyle(obj) {
        let keys = Object.keys(obj);
        return keys.map((key) => {
            return this.toStyleRule(key, obj[key]);
        }).join(" ");
    }
    
    StyleUtil.prototype.toStyleRule = function(name, value) {
        if (name === "rect") {
            let [left, top, width, height] = this.getRectStylesAsArray(value);
            return this.getRect(left, top, width, height);
        }
        return name + ":" + value + ";";
    };
    
    StyleUtil.prototype.setContainerStyle = function getContainer(container) {
        this.style.container.rect = this.getConsolePosition().rect;
        container.setAttribute("style", this.toStyle(this.style.container));
    };
    
    StyleUtil.prototype.getRect = function(left, top, width, height) {
        return [
            this.toStyleRule("left", left),
            this.toStyleRule("top", top),
            this.toStyleRule("width", width),
            this.toStyleRule("height", height)
            ].join(' ');
    };

    StyleUtil.prototype.getRectStylesAsArray = function getRectStylesAsArray(stylesString) {
        let styles = stylesString.split(" ");
        if (styles.length === 4) {
            return styles;
        }
        return styles.reduce((agg, next, index) => {
            if (agg.last) {
                let last = [agg.last, next].join(" ");
                if (next.indexOf(")") > -1) {
                    agg.finalArray.push(last);
                    agg.last = null;
                } else {
                    agg.last = last;
                }
            } else if (next.indexOf("(") > -1) {
                agg.last = next;
            } else {
                agg.finalArray.push(next);
            }
            return agg;
        }, {finalArray: []}).finalArray;
    };

    StyleUtil.prototype.getConsolePosition = function() {
        switch (QC.config.location) {
            case QC.LOCATIONS.LEFT:
                return this.style.left;
            case QC.LOCATIONS.RIGHT:
                return this.style.right;
            case QC.LOCATIONS.TOP:
                return this.style.top;
            case QC.LOCATIONS.BOTTOM:
                return this.style.bottom;
            default:
                return this.style.full;
        }
    };
    
    QC.DI.register("styleUtil", StyleUtil, ["style"]);

})(QC || (QC = {}));

var QC;
(function(QC) {
    "use strict";

    function Suggest() {
    }
    
    Suggest.prototype.getSuggestion = function(fullCommand) {
        var suggestion = new QC.Suggestion(fullCommand);
        suggestion.suggestions = this.getSuggestions(suggestion.getLastCommand(), true);
        return suggestion;
    };
    
    Suggest.prototype.getSuggestions = function(partialCommand, ignoreErrors) {
        var tmpName = "";
        return partialCommand.split(".")
        .reduce((context, name, index, arr) => {
            // get suggestions only for last object
            if (arr.length === index + 1) {
                return this.getSuggestionsForName(context, name);
            }
            
            if (!context[name]) {
                if (!ignoreErrors) {
                    console.error(name + " does not exist on object: " + tmpName);
                }
                return null;
            }
            tmpName += (tmpName !== "") ? ("." + name) : name;
            // update context to be the built object.
            return context[name];
        }, window);
    };
    
    Suggest.prototype.getSuggestionsForName = function(context, name) {
        var options = this.getContextualSuggestions(context);
        var filtered = options.filter(function(option) {
            return option.toUpperCase().indexOf(name.toUpperCase()) === 0;
        });
        return filtered || [name];
    };
    
    Suggest.prototype.getContextualSuggestions = function(context) {
        var suggestions = [];
        for(var i in context) {
            suggestions.push(i);
        }
        //console.log(suggestions);
        return suggestions;
    };

    
    QC.DI.register("suggest", Suggest, []);
    
    
})(QC || (QC = {}));
var QC;
(function(QC) {
    "use strict";
   
    function Suggestion(fullCommand) {
        this.fullCommand = fullCommand;
        this.commandsToComplete = this.getLastCommand();
    }
    
    Suggestion.prototype.getLastCommand = function () {
        if (!this.fullCommand || this.fullCommand === "") {
            return "";
        }
        var commands = this.fullCommand.split(" ");
        return commands.pop();
    };
    
    Suggestion.prototype.getAutoCompetion = function () {
        if (!this.suggestions || !this.suggestions.length) {
            return this.fullCommand;
        }
        return this.fullCommand
        .split(".")
        .map((text, index, arr) => {
            if (arr.length === index + 1) {
                return this.getBestSuggestion() || text;
            }
            return text;
        })
        .join(".");
    };
    
    Suggestion.prototype.getBestSuggestion = function () {
        if (!this.suggestions || !this.suggestions.length) {
            return null;
        }
        return this.suggestions.sort((a, b) => {
            return a.length - b.length;
        })[0];
    };
        
    QC.Suggestion = Suggestion;
})(QC || (QC = {}));
var QC;
(function(QC) {

    View.STYLE_PREFIX = "qc-";
    function View(styleUtil) {
        QC.setLocation = (location) => this.setLocation(location);
        this.styleUtil = styleUtil;
        this.addCssLink(this.styleUtil.getCssString());
    }

    View.prototype.addCssLink = function(cssAsString) {
        let blob = new Blob([cssAsString], {type: 'text/css'});
        let linkTag = this.getLinkTag();
        linkTag.href = window.URL.createObjectURL(blob);
    };

    View.prototype.getLinkTag = function() {
        var link = document.getElementById("qc-styles");
        if (link) {
            return link;
        }
        return this.createElement({tag: "link", parent: document.head, 
                                    attrs: [{"id": "qc-styles"}, {"rel": "stylesheet"}]})
    };

    View.prototype.addToScreen = function() {
        this.consoleContainer = this.createElement({tag: "div", parent: document.body, 
                classes: ["container", QC.config.location]});

        this.consoleDiv = this.createElement({tag: "textarea", parent: this.consoleContainer, 
                    attrs: [{"readonly": ""}], classes: ["text-area"]});

        this.addInput();
    };
    
    View.prototype.addInput= function() {
        this.addCompletionHint();

        this.input = this.createElement({tag: "input", 
            attrs: [{"id": "consoleInput"}, {"type": "text"}], 
            classes: ["input"], parent: this.consoleContainer});
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
        this.completionHint = this.createElement({tag:"div", classes: ["completion-hint"], parent: this.consoleContainer});
    };
    
    View.prototype.setLocation = function(location) {
        QC.config.location = location;
        if (this.consoleContainer) {
            this.consoleContainer.className = ["qc-container", location].join(" " + View.STYLE_PREFIX);
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
        console.log("should toggle console");
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

    View.prototype.createElement = function(elementConfig) {
        var elem = document.createElement(elementConfig.tag);
        if (elementConfig.parent) {
            elementConfig.parent.appendChild(elem);
        }
        if (elementConfig.classes) {
            elem.className = View.STYLE_PREFIX + elementConfig.classes.join(" " + View.STYLE_PREFIX);
        }
        if (elementConfig.attrs) {
            elementConfig.attrs.forEach((attr) => {
                let key = Object.keys(attr)[0];
                elem.setAttribute(key, attr[key]);
            });
        }
        return elem;
    };
    
    QC.DI.register("view", View, ["styleUtil"]);

})(QC || (QC = {}));
