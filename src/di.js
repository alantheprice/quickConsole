var QC; 
(function(QC) {
    "use strict";
   
    function DI() {
        this.statics = [];
        this.buildable = [];
        this.registered = [];
    }
    
    DI.prototype.register = function(name, func, dependencies) {
        this.buildable[name] = {
            name: name, 
            func: func, 
            dependencies: (dependencies || [])
        };
        this.registered.push(this.buildable[name]);
    };

    DI.prototype.registerStatic = function(name, staticVar) {
        this.statics[name] = staticVar;
    };
    
    DI.prototype.load = function(name) {
        var loaded = this.statics[name];
        if (!loaded) {
            loaded = this.build(name);
            this.statics[name] = loaded;
        }
        return loaded;
    };
    
    DI.prototype.build = function(name) {
        let obj = this.buildable[name];
        if (!obj) {
            throw new Error("'" + name + "'  has not been registered!");
        }
        let dependencies = [];
        if (obj.dependencies && obj.dependencies.length) {
            obj.dependencies.forEach( depName => {
                let dep = this.load(depName);
                dependencies.push(dep);
            });
        }
        //  FROM: http://stackoverflow.com/a/28244500 
        return new (obj.func.bind.apply(obj.func, [null].concat(dependencies)))();

    };
    
    DI.prototype.getDependencyMap = function() {
        return this.registered.map(build => {
            if (!build) {
                return "";
            }
            let deps = this.getDependencies(build.dependencies, [build.name], 2);
            return build.name + ":" + "\n" + deps;
        }).join("\n");
    };
    
    DI.prototype.getDependencies = function(deps, referencers, insetDepth) {
        if ((!deps || !deps.length)) {
            if (insetDepth < 2) {
                return Array(insetDepth).join("--") + "No Dependencies \n";
            }
            return "";
        }
        return deps.map(dep => {
            if (referencers.indexOf(dep) > -1) {
                return Array(insetDepth).join("--") + "Recursive depency on: " + dep + "\n";
            }
            var ancestors = referencers.slice(0);
            ancestors.push(dep);
            let buildable = this.buildable[dep] || {};
            return Array(insetDepth).join("--") + dep + "\n" + 
                this.getDependencies(buildable.dependencies, ancestors, insetDepth +1);
        }).join("");
    };

    
    // instantiating directly since it is needed to build everything else.
    QC.DI = new DI();
        
})(QC || (QC = {}));
