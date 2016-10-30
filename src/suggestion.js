var QC;
(function(QC) {
    "use strict";
    
    var Suggestion = (function() {
        
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
        
        return Suggestion;
    })();
        
    QC.Suggestion = Suggestion;
})(QC || (QC = {}));