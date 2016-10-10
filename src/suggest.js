var QC;
(function(QC) {
    "use strict";
    var Suggest = (function() {
        function Suggest() {
        }
        
        Suggest.prototype.getBestFit = function(partialCommand) {
            if (!partialCommand || partialCommand === "") {
                return "";
            }
            var commands = partialCommand.split(" ");
            var commandToComplete = commands.pop();
            var suggestion = this.getSuggestions(commandToComplete);
            if (commands && commands.length) {
                return commands.join(" ") + " " + suggestion;
            } else {
                return suggestion;
            }
        };
        
        Suggest.prototype.getSuggestions = function(partialCommand) {
            var context = window;
            var tmpName = "";
            var final = partialCommand;
            partialCommand.split(".")
            .forEach((name, index, arr) => {
                if (arr.length === index + 1) {
                    final = this.getSuggestionsForName(context, name);
                    final = (tmpName !== "") ? (tmpName + "." + final) : final;
                    return final;
                }
                
                if (!context[name]) {
                   console.error(name + " does not exist on object: " + tmpName);
                   return;
                }
                tmpName += (tmpName !== "") ? ("." + name) : name;
                context = context[name];
            });
            return final;
        };
        
        Suggest.prototype.getSuggestionsForName = function(context, name) {
            var options = this.getContextualSuggestions(context);
            var filtered = options.filter(function(option) {
                return option.toUpperCase().indexOf(name.toUpperCase()) === 0;
            });
            return filtered[0] || name;
        };
        
        Suggest.prototype.getContextualSuggestions = function(context) {
            var suggestions = [];
            for(var i in context) {
                suggestions.push(i);
            }
            console.log(suggestions);
            return suggestions;
        };
        
        return Suggest;
    })();
    
    QC.DI.register("suggest", Suggest, []);
    
    
})(QC || (QC = {}));