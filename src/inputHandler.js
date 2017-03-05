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