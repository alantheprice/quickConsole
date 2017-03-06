var QC;
(function(QC) {

    function View(styleUtil) {
        QC.setLocation = (location) => this.setLocation(location);
        this.styleUtil = styleUtil;
        this.addCssLink(this.styleUtil.getCssString());
    }

    View.prototype.addCssLink = function(cssAsString) {
        let blob = new Blob([cssAsString], {type: 'text/css'});
        let linkTag = this.getLinkTag();
        linkTag.href = window.URL.createObjectURL(blob);
    };

    View.prototype.getLinkTag = function() {
        var link = document.getElementById("qc-styles");
        if (link) {
            return link;
        }
        return this.createElement({tagName: "link", 
                attributes: [{"id": "qc-styles"}, {"rel": "stylesheet"}], parent: document.head})
    };

    View.prototype.addToScreen = function() {
        this.consoleContainer = this.createElement({tagName: "div", parent: document.body, 
                classes: ["qc-container", "qc-" +QC.config.location]});

        this.consoleDiv = this.createElement({tagName: "textarea", parent: this.consoleContainer, 
                    attributes: [{"readonly": ""}], classes: ["qc-text-area"]});

        this.addInput();
    };
    
    View.prototype.addInput= function() {
        this.addCompletionHint();

        this.input = this.createElement({tagName: "input", 
            attributes: [{"id": "consoleInput"}, {"type": "text"}], 
            classes: ["qc-input"], parent: this.consoleContainer});
        this.addInputHandler(this.handler);
    };

    View.prototype.addInputHandler = function(handler) {
        if (this.addedHandler) {
            return;
        }
        if (!this.input) {
            this.handler = handler || this.handler;
            return;
        }
        this.addedHandler = true;
         this.input.onkeydown = (e) =>  {
            handler(e, this.input, this.completionHint);
        };
    }
    
    View.prototype.addCompletionHint = function() {
        this.completionHint = this.createElement({tagName:"div", classes: ["qc-completion-hint"], parent: this.consoleContainer});
    };
    
    View.prototype.setLocation = function(location) {
        QC.config.location = location;
        if (this.consoleContainer) {
            this.consoleContainer.className = ["qc-container", "qc-" + location].join(" ");
        }
    };

    View.prototype.logToScreen = function(logList) {
        if (this.consoleDiv) {
            this.consoleDiv.innerText = logList.join(this.getSeperator());
        }
    };
    
    View.prototype.getSeperator = function() {
        if (!this.logSeperator) {
            this.logSeperator = String.fromCharCode(13) +
                Array(50).join("=") +
                String.fromCharCode(13);
        }
        return this.logSeperator;
    };
    
    View.prototype.toggleConsole = function() {
        console.log("should toggle console");
        if (this.consoleContainer) {
            this.consoleContainer.remove();
            this.consoleContainer = undefined;
        } else {
            this.addToScreen();
            this.input.focus();
        }
    };
    
    View.prototype.getViewAsString = function() {
        if (!this.consoleContainer) {
            return "";
        }
        return this.consoleContainer.outerHTML;  
    };

    View.prototype.createElement = function(elementConfig) {
        var elem = document.createElement(elementConfig.tagName);
        if (elementConfig.parent) {
            elementConfig.parent.appendChild(elem);
        }
        if (elementConfig.classes) {
            elem.className = elementConfig.classes.join(" ");
        }
        if (elementConfig.attributes) {
            elementConfig.attributes.forEach((attr) => {
                let key = Object.keys(attr)[0];
                elem.setAttribute(key, attr[key]);
            });
        }
        return elem;
    };
    
    QC.DI.register("view", View, ["styleUtil"]);

})(QC || (QC = {}));
