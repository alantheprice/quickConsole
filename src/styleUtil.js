var QC;
(function(QC) {
    "use strict";

    function StyleUtil(style) {
        this.style = style;
    }

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
