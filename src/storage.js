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