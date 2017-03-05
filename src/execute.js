var QC;
(function(QC) {
    "use strict";
    
    function Execute(log) {
        //this.log = log;
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
                    resolve({name: "log", value: "Eval is not allowed on this platform, defaulting to simple execution which only allow direct function calls with primitives as params"});
                    this.executor = this.executeSafe;
                    this.executeSafe(evalString);
                }
                return Promise.reject(error.message);
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
            // check to see if it is a promise
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
