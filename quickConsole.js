var quickConsole = (function() {
    
    var innerConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        clear: console.clear,
        onError: window.onerror
    };
    
    var logList = [], consoleList = [], consoleIndex = 0;
    
    // elements.
    var consoleDiv, consoleContainer, input;
    
    var maxMessageCount = 50;
    var maxConsoleHistory = 20;
    var consoleExecutor = executeEval;
    var registered = false;
    
    var locations = {LEFT: "left", RIGHT: "right", TOP: "top", BOTTOM: "bottom", FULL: "full"};

    var config = {
        overrideNativeCalls: true,
        location: locations.LEFT
    };
    
    console.log = msg => writeLog("log", msg);
    console.error = msg => writeLog("error", msg);
    console.warn = msg => writeLog("warn", msg);
    console.info = msg => writeLog("info", msg);
    console.clear = clear;
    window.onerror = (errorMsg, url, lineNumber, column) => {
            writeLog("error", [errorMsg, url, lineNumber, column].join("\n"));
            if (innerConsole.onError) {
                innerConsole.onError(errorMsg, url, lineNumber, column);
            }
        };
    
    loadSavedConsoleHistory();

    return {
        innerConsole: innerConsole,
        logList: logList,
        executeEval: executeEval,
        executeFunction: executeFunction,
        updateText: updateText,
        registerToggleHandler: registerToggleHandler,
        toggleConsole: toggleConsole,
        init: init,
        setLocation: setLocation,
        locations: locations
    };
    
    function loadSavedConsoleHistory() {
        var found = retrieve("consoleHistory");
        if (found) {
            consoleList = JSON.parse(found);
            consoleIndex = consoleList.length - 1;
        }
    }
    
    function init(options) {
        config.location = options.location || config.location;
        config.overrideNativeCalls = options.overrideNativeCalls || config.overrideNativeCalls;
    }
    
    function writeLog (logName, msg) {
        var forScreen = logName.toUpperCase() + ": " + formatMessage(msg);
        addToLogList(forScreen);
        logToScreen();
        
        if (!innerConsole[logName] || config.overrideNativeCalls) {
            return;
        }
        innerConsole[logName](msg);
    }
    
    function formatMessage(msg) {
        if (typeof msg === "string") {
            return msg;
        } else if (isElement(msg)) {
            return formatElement(msg);
        } else {
            return JSON.stringify(msg);
        }
    }
    
    function formatElement(msg) {
        var prefix = "Element: Html" + String.fromCharCode(13);
        var offset = 1;
        return prefix + msg.outerHTML
             .replace(/(?:\r\n|\r|\n)/g, "#")
             .replace(/>/g, ">#")
             .replace(/##/g, "#")
             .split("#")
             .map(val => {
                 val = val.trim();
                 if (val[1] && val[1] === "/" && offset > 2) {
                     offset = offset - 2;
                     return getSpacer(offset) + val;
                 } else if (val[0] && val[0] === "<" && val[1] !== "i") {
                     var tempOffset = offset;
                     offset = offset + 2;
                     return getSpacer(tempOffset) + val;
                 } else {
                     return getSpacer(offset) + val;
                 }
             })
             .join(String.fromCharCode(13));
    }
    
    function getSpacer(num) {
        return Array(num).join("__");
    }
    
    function clear() {
        store("consoleMsg", JSON.stringify(logList));
        innerConsole.clear();
    }
    
    function addToLogList(msg) {
        if (logList.length >= maxMessageCount) {
            logList.shift();
        }
        logList.unshift(msg);

    }
    
    /** Setup for the on screen quick console. */
    function addToScreen() {
        var styles = getContainerStyles();
        consoleContainer = document.createElement("div");
        consoleContainer.setAttribute("style", styles);
        document.body.appendChild(consoleContainer);
        consoleDiv = document.createElement("div");
        consoleDiv.style = getPosition("0", "50px", "100%", "90vh");
        consoleContainer.appendChild(consoleDiv);
        consoleDiv.innerText = logList.join(String.fromCharCode(13));
        addInput();
    }
    
    function getContainerStyles() {
        return getConsolePosition() +
            toStyle("background", "rgba(250,250,250,.87)") +
            toStyle("z-index", 2000) +
            toStyle("overflow", "auto") + 
            toStyle("color", "#404040");
    }
    
    function addInput() {
        input = document.createElement("input");
        var styles = getPosition(0, 0, "97%", "20px", "relative") +
            "border:1px solid rgba(90,90,90,.7);" +
            "padding:5px;margin:1%;z-index: 2; outline: none;";
        input.setAttribute("id", "consoleInput");
        input.setAttribute("type", "text");
        input.setAttribute("style", styles);
        input.onkeydown = (e) => updateText(e);
        consoleContainer.appendChild(input);
    }
    
    function updateText(event) {
        if (checkForConsoleToggle(event)) {
            return;
        } 
        
        if (event.keyCode === 13) {
            addToConsoleHistory(input.value);
            try {
              consoleExecutor(input.value);
            } catch(error) {
              // error already logged elsewhere just catching it here so we can continue execution.
            }
            input.value = "";
            consoleIndex = consoleList.length - 1;
        } else if (event.keyCode === 38) { // up arrow pressed
            useConsoleHistory(true);
        } else if (event.keyCode === 40) { // up arrow pressed
            useConsoleHistory(false);
        }
    }
    
    function addToConsoleHistory(value) {
        if (consoleList.length >= maxConsoleHistory) {
            consoleList.shift();
        }
        consoleList.push(input.value);
        store("consoleHistory", JSON.stringify(consoleList));
    }
    
    function useConsoleHistory(up) {
        if (!consoleList.length) {
            // no history, just return.
            return;
        }
        input.value = "";
        input.value = consoleList[consoleIndex];
        // needed to move the cursor to the end.
        input.value = input.value;
        if (up) {
            consoleIndex = consoleIndex > 0 ? consoleIndex - 1 : 0;
        } else if (consoleIndex < consoleList.length - 1) {
            consoleIndex += 1;
        }
    }
    
    function setLocation(location) {
        config.location = location;
        if (consoleContainer) {
            consoleContainer.setAttribute("style", getContainerStyles());
        }
    }
    
    function getConsolePosition() {
        switch (config.location) {
            case locations.LEFT:
                return getPosition(0, 0, "50%", "100%");
            case locations.RIGHT:
                return getPosition("50%", 0, "50%", "100%");
            case locations.TOP:
                return getPosition(0, 0, "100%", "50%");
            case locations.BOTTOM:
                return getPosition(0, "50%", "100%", "50%");
            default:
                return getPosition(0, 0, "100%", "100%");
        }
    }
    
    function getPosition(left, top, width, height, position) {
        // use default of absolute if position unspecified
        var positionStyle = toStyle("position", position ? position : "absolute");
        var style = getRect(left, top, width, height).join(" ");
        return style + positionStyle;
    }
    
    function getRect(left, top, width, height) {
        return [
            toStyle("left", left),
            toStyle("top", top),
            toStyle("width", width),
            toStyle("height", height)
            ];
    }
    
    function toStyle(name, value) {
        return name + ":" + value + ";";
    }
    
    function logToScreen() {
        if (consoleDiv) {
            consoleDiv.innerText = logList.join(String.fromCharCode(13));
        }
    }
    
    /** execution */
    
    function executeEval(evalString) {
        var response;
        try{
            response = eval(evalString);
        } catch(error) {
            console.error(error.message);
            if (error.message && error.message.indexOf("Refused to evaluate a string as JavaScript because 'unsafe-eval'") > -1) {
              console.log("Eval is not allowed on this platform, defaulting to simple execution which only allow direct function calls with primitives as params");
              consoleExecutor = executeSafe;
              executeSafe(evalString);
            }
        }
        handleExecuteResponse(response);
    }
    
    function executeSafe(inputValue) {
      if (inputValue.indexOf("(") > -1) {
        var parts = inputValue.split("(");
        var funcName = parts[0];
        var params = (parts && parts.length) ? parts[1].split(")")[0].split(",") : [];
        executeFunction(funcName, params);
      } else {
        logObject(inputValue);
      }
    }
    
    function executeFunction(funcName, params) {
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
        handleExecuteResponse(response);
    }
    
    function logObject(objName) {
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
        handleExecuteResponse(context);
    }
    
    function handleExecuteResponse(response) {
        if (!response) {
            return;
        }
        // check to see if it is a promise
        if (response.then) {
            response.then(returnVal => {
                writeLog("log", returnVal);
            });
            return;
        }
        writeLog("log", response);
    }
    
    function isElement(obj) {
        return typeof obj.outerHTML !== "undefined";
    }
    
    function registerToggleHandler(obj) {
        if (!registered) {
            registerKeyHandler(window);
            registered = true;
        }
        if (!obj) {
            return;
        }
        registerKeyHandler(obj);
    }
    
    function registerKeyHandler(obj) {
        var currentHandler = obj.onkeydown;
        obj.onkeyup = (e) => {
            checkForConsoleToggle(e);
          if (currentHandler) {
              currentHandler(e);
          }
        };
    }
    
    var toggleConsoleTimeout;
    
    function checkForConsoleToggle(e) {
        // ctrl + alt + shift + d to open console
        if (e.shiftKey && e.altKey && e.ctrlKey && e.keyCode === 68) {
            clearTimeout(toggleConsoleTimeout);
            toggleConsoleTimeout = setTimeout(() => {
                toggleConsole();
            }, 200);
            return true;
        }
        return false;
    }
    
    function toggleConsole() {
        if (consoleContainer) {
            consoleContainer.remove();
            consoleContainer = undefined;
        } else {
            addToScreen();
        }
    }
    
    function store(key, value) {
        if (!useLocalStorage()) {
             return;  
        }
        localStorage.setItem(key, value);
    }
    
    function retrieve(key) {
        if (!useLocalStorage()) {
             return null;
        }
        return localStorage.getItem(key);
    }
    
    function useLocalStorage() {
        var hasLocalStorage = false;
        try {
            hasLocalStorage = typeof window.localStorage !== "undefined";
        } catch(error) {
            // no need to catch anything, just use local storage if available.
        }
        return useLocalStorage;
    }
    
})();

