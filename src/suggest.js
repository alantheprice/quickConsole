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