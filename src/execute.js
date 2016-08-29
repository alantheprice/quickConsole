var QC;
(function(QC) {
    
    var Execute = (function() {
        
        function Execute(log) {
            this.log = log;
            this.executor = this.executeEval;
        }
        
        Execute.prototype.eval = function(evalString) {
            this.executor(evalString);
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
            this.executeFunction(funcName, params);
          } else {
            this.logObject(inputValue);
          }
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
