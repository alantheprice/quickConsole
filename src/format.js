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