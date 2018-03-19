var sjs = (function(UNDEF) {
    var _mods = {};             //for js,sjs mod
    var MOD_STATUS = {
        INIT:0                    //new
        ,NEEDLOADING:10           //(js mod only)
        ,LOADING:20               //start load mod define file
        ,RESOLVING:30             //get sub need list(sjs mod only)
        ,RESOLVED:40              //start to load sub need(sjs mod only)
        ,LOADED:50                //ready
        ,CALCULATING:60           //calculating(sjs mod only)
        ,CALCULATED:70            //calculated(sjs mod only)
    };

    //js mod placeholder
    function _name(id){
        this.id = id;
        this._ref = [];
    }

    _name.prototype._load = function(){};

    function _js(id){
        this.id = id;
        this._ref = [];
        this._needs = [];           //seq load
        this._status = MOD_STATUS.INIT;
        this._noResult = true;
    }

    _js.prototype = {
        _load:function(){
            if(this._status < MOD_STATUS.NEEDLOADING){
                this._status = MOD_STATUS.NEEDLOADING;
                if(this._needs.length){
                    for(var i=0;i<this._needs.length;i++){
                        this._needs[i]._load();
                    }
                }
                else{
                    this._status = MOD_STATUS.LOADING;
                    this._onLoad();
                }
            }
            else if(this._status >= MOD_STATUS.LOADED){
                this._onLoaded();
            }
        }

        ,_onNeedLoaded : function(needID){
            if(this._status < MOD_STATUS.LOADING){
                var allLoaded = true;
                for(var i=0;i<this._needs.length;i++){
                    if(this._needs[i]._status < MOD_STATUS.LOADED){
                        //console.log("**but " + this._mods[i].id + " is not loaded");
                        allLoaded = false;
                        break;
                    }
                }
                if(allLoaded){
                    //console.log("**js loaded:" + this.id + ",from:" + needID);
                    this._status = MOD_STATUS.LOADING;
                    this._onLoad();
                }
            }
        }

        ,_onLoad:function(){
            _loadJs(this.id,this._loaded,this,this.id,this._defaultPath);
        }

        ,_loaded:function(){
            this._status = MOD_STATUS.LOADED;
            this._onLoaded();
        }

        ,_onLoaded:function(){
            for(var i=0;i<this._ref.length;i++){
                this._ref[i]._onNeedLoaded(this.id);
            }
        }

        ,_replaceMod:function(needID){
            if(this._status = MOD_STATUS.LOADED){
                throw new Error(this.id + " is loaded,but still _replaceMod:" + needID);
            }
            for(var i=0;i<this._needs.length;i++){
                if(this._needs[i].id == needID){
                    this._needs[i] = _mods[needID];
                    break;
                }
            }
        }
    }

    
    function _sjs(id){
        this.id = id;
        this._ref = [];
        this._needs = [];      
        this._status = MOD_STATUS.INIT;
        //this._mods = [];          //define in _loaded
        this._css = [];
    }

    _sjs.prototype = {
        _load : function(){
            if(this._status < MOD_STATUS.LOADING){
                this._status = MOD_STATUS.LOADING;
                _loadJs(this.id,this._loaded,this,this.id,this._defaultPath);
            }
            else if(this._status == MOD_STATUS.RESOLVING){
                this._loaded();
            }
            else if(this._status >= MOD_STATUS.LOADED){
                this._onLoaded();
            }
        }

        //sjs.define
        ,_onDefine : function(){
            //one file can not sjs.define more than once
            if(this._status >= MOD_STATUS.RESOLVING){
                throw new Error(this.id + " sjs.define.repeat!");
            }
            if(this.id){
                //IE6-10,can getID on new _sjs
                this._status = MOD_STATUS.RESOLVING;
            }
            //else wait _setID immediately
        }
        
        ,_setID:function(id){
            //debugger;
            if(this._status >= MOD_STATUS.RESOLVING){
                throw new Error("can not sjs.using for sjs.run file,maybe can sjs.loadJs for sjs.run or use sjs.define instead of sjs.run:" + id);
            }
            this.id = id;
            this._status = MOD_STATUS.RESOLVING;
            this._ref = _mods[id]._ref;
            _mods[id] = this;
            for(var i=0;i<this._ref.length;i++){
                this._ref[i]._replaceMod(id);
            }
        }

        //support relative mod,like .mod ..mod2 ...mod3
        ,_getModID:function(name,refID){
            if(name.indexOf(".")==0 && name.indexOf("./")!=0 && name.indexOf("../")!=0
                    && name.indexOf(".\\")!=0 && name.indexOf("..\\")!=0){
                if(!refID){
                    throw new Error("can not use relative path for top sjs.using:" + name);
                }
                var currentJs = refID.split(".");
                var folderLevel;
                for(folderLevel=1;folderLevel<name.length;folderLevel++){
                    if(name.substr(folderLevel,1)!="."){
                        break;
                    }
                }
                currentJs.length = currentJs.length - folderLevel;
                if(currentJs.length<=0){
                    throw new Error("relative path error,from:" + refID + ",name:" + name);
                }
                var ret  = currentJs.join(".") + "." + name.substr(folderLevel);
                return ret;
            }
            return name;
        }

        ,_parseJsMod:function(){
            var mod;
            //default path for a js mod(reference js almost like this ,because can sjs.path to modify its version)
            var nameAndDefaultPath = name.split("=");      //for js only,loadJs("jQuery=ref/jQuery-1.1.3.min.js")
            var defaultPath;
            if(nameAndDefaultPath.length>1){
                name = nameAndDefaultPath[0];
                defaultPath = nameAndDefaultPath[1];
            }

            var seqMods = name.split(",");           //highcharts need jquery and abc load first,sjs.loadJs("jQuery,abc,highcharts=pathtohighcharts")
            var modID = seqMods.pop();               //the last one is real js mod

            //nameMod is just a replaceholder(like highcharts need jQuery,if jQuery is not found,we set jQuery as a name mod temporarily)
            var nameMod;
            if(_mods[modID]){
                mod = _mods[modID];
                if(mod instanceof _name){
                    //console.log(modID + " is a _name mod:" + this.id);
                    nameMod = mod;      //will create real mod and replace nameMod
                    mod = null;
                }
                else{
                    //if has seqMods or defaultPath,the last one must define here,but it has already defined in other place
                    if(seqMods.length || defaultPath){
                        throw new Error(modID + " is define,can not define again:" + this.id + ",already define in:" + mod._ref[0].id);
                    }
                }
            }

            if(!mod){
                mod = _mods[modID] = new _js(modID);
                defaultPath && (mod._defaultPath = defaultPath);
                for(var i=0;i<seqMods.length;i++){
                    var seqModID = seqMods[i];
                    //seqMod is defined or not
                    var seqMod = _mods[seqModID] = _mods[seqModID] || new _name(seqModID);
                    //if has already loading,it's ok
                    mod._needs.push(seqMod);
                    seqMod._ref.push(mod);
                }
                
                if(nameMod){
                    mod._ref = nameMod._ref;
                    for(var i=0;i<mod._ref.length;i++){
                        mod._ref[i]._replaceMod(mod.id);
                    }
                }
            }
            return mod;
        }

        //when js file onload,we must check script execute right or not
        ,_loaded : function(){
            //maybe the js is not a sjs.define file
            if(this._status < MOD_STATUS.RESOLVING){
                throw new Error(this.id + " is not a sjs.define module,maybe use sjs.load instead of sjs.using!");
            }
            else if(this._status >= MOD_STATUS.RESOLVED){
                throw new Error(this.id + " has already resolved,maybe sjs.define more then once in a js file!");
            }

            this._status = MOD_STATUS.RESOLVED;
            this._mods = [];
            for(var i=0;i<this._needs.length;i++){
                var need = this._needs[i];
                var name = need.name.toLowerCase();
                var mod = null;

                if(need.type==_js){
                    mod = this._parseJsMod(name);
                }
                else{
                    var modID = this._getModID(name,this.id);
                    mod = _mods[modID] = _mods[modID] || new need.type(modID);
                }

                mod._ref.push(this);
                this._mods.push(mod);
            }

            if(this._mods.length){
                for(var i=0;i<this._mods.length;i++){
                    var mod = this._mods[i];
                    mod._load();
                }
            }
            else{
                this._status = MOD_STATUS.LOADED;
                this._onLoaded();
            }
        }

        //when sjs.using(js),it's not resolved yet,mod created for remember all its references only,then when the real mod define,we can copy the references to the real mod._ref
        ,_replaceMod:function(needID){
            if(this._status = MOD_STATUS.LOADED){
                throw new Error(this.id + " is loaded,but still _replaceMod:" + needID);
            }
            for(var i=0;i<this._mods.length;i++){
                if(this._mods[i].id == needID){
                    this._mods[i] = _mods[needID];
                    break;
                }
            }
        }
    
        ,_onNeedLoaded : function(needID){
            if(this._status < MOD_STATUS.LOADED){
                var allLoaded = true;
                for(var i=0;i<this._mods.length;i++){
                    if(this._mods[i]._status < MOD_STATUS.LOADED){
                        //console.log("**but " + this._mods[i].id + " is not loaded");
                        allLoaded = false;
                        break;
                    }
                }
                if(allLoaded){
                    //console.log("**mod loaded:" + this.id + ",from:" + needID);
                    this._status = MOD_STATUS.LOADED;
                    this._onLoaded();
                }
            }
        }

        ,_onLoaded:function(){
            if(!this._ref.length){
                this._calculate();
            }
            else{    
                for(var i=0;i<this._ref.length;i++){
                    this._ref[i]._onNeedLoaded(this.id);
                }
            }
        }

        ,_loadCss:function(){
            for(var i=0;i<this._css.length;i++){
                var css = this._css[i].toLowerCase();
                css = this._getModID(css,this.id)
                _loadCss(css);
            }
        }

        ,_calculate:function(){
            this._status = MOD_STATUS.CALCULATING;
            if(typeof(this._fn)!="function"){
                this._loadCss();
                this._result = this._fn;
            }
            else{
                var args = [];
                for(var i=0;i<this._mods.length;i++){
                    var mod = this._mods[i];
                    if(!mod._noResult){     //js has executed on load
                        if(mod._status < MOD_STATUS.LOADED){
                            throw new Error("mod has not been loaded yet!");
                        }
                        else if(mod._status == MOD_STATUS.CALCULATING){
                            throw new Error("may be has loop using");
                        }
                        else if(mod._status >= MOD_STATUS.CALCULATED){
                            args.push(mod._result);
                        }
                        else{
                            args.push(mod._calculate());
                        }
                    }
                }
                this._loadCss();            //needs css load first,then self css,because in IE,the later css loaded,the priority higher
                //sjs.__calID = sjs.__calID || 1000;
                //var id = sjs.__calID++;
                //console.log(id,"【【before real calculate】】" + this.id);
                try{
                    this._result = this._fn.apply(this,args);
                }
                catch(ex){
                    throw new Error("function execute error:" + this.id + "," + ex.description);
                }
                //console.log(id,"【【after real calculate】】" + this.id);
            }
            this._status = MOD_STATUS.CALCULATED;
            return this._result;
        }


        //public interface-------------------------------------------------------
        ,using:function(js){
            this._needs.push({type:_sjs,name:js});
            return this;
        }

        ,loadJs:function(js){
            this._needs.push({type:_js,name:js});
            return this;
        }

        ,loadCss:function(css){
            //not as a module
            this._css.push(css);
            return this;
        }

        ,define:function(fn){
            this._fn = fn;
            this._onDefine();
        }

        ,run:function(fn){
            this._fn = fn;

            //the first sjs.run,no id,but have currentMod,clear for no disturb the real currentMod later
            currentMod = null;
            this._status = MOD_STATUS.RESOLVING;
            this._load();
        }
    }


    //package version for cache,and load from _lib(runtime folder)
    //if has version(only for direct path,not mod path style),we add in the end of ns.sub.mod.js?1.2.3

    //one is for path? sjs.path("Core6.All","_lib/core6.all-1.0.js","js")   //core6/all-1.0.css load by core6.all-1.0.js,so no need

    //defaultFolder to ./src or http://www.cdn.com/sjs/,only support ./ or src/xxx,not support ../ or ../../
    //for one special mod,we can load mod from other place
    //sjs.path("Core6","src/Core6");
    //sjs.path("PCI.Tools","/RIAService/Apps/PCI/Tools/_ui")                    //all file set path
    //sjs.path("Core6.Widget.Input.Text","http://www.xxx.com/sjs/text.js");     //where can you find the mod file
    //sjs.path("jQuery","ref/jquery-1.4.2.min.js")

    //ref js can use alias name of the mod id by reuse
    //but map priority higher
    //sjs.loadJs("jQuery=ref/jquery-1.3.2.min.js");         //modID:jQuery=defult path
    //sjs.loadJs("jQuery,highcharts=ref/highcharts-1.2.js");

    //map is upgrade,and want to replace(still evaluate need or not)
    //this.id = PCI.NewTools,actually using PCI.NewTools,mod id also is PCI.NewTools
    //PCI.NewTools can map again???
    //as usually,can not sjs.using PCI.NewTools again,if using again,different mod
    //so if want map again,sjs.map("PCI.Tools","PCI.Tools3","js);
    //sjs.map("PCI.Tools","PCI.Tools2","js")                                        //js only
    //sjs.map("Core6.Widget.Input.Text","PCI.Widget.Input.Text")                    //js and css
    //sjs.using("!PCI.Tools")                               //ignore map,because new may be upgrade from the old
    

    var _modPath = {};
    var _modVersion = {};           //match reMap result
    var _defaultFolder = "";
    function _getModVersion(orgPath){
        var paths = orgPath.split(".");
        for(var i=0,len=paths.length;i<len;i++){
            var package = paths.join(".");
            if(_modVersion[package]){
                return _modVersion[package];
            }
            paths.pop();
        }
        return new Date().getTime();
    }

    function _getModDefPath(pathID,ext) {
        var orgPath = pathID;
        var paths = pathID.split(".");
        for(var i=paths.length;i>0;i--){
            var key = paths.join(".");
            if(_modPath[key]){
                var folder = _modPath[key];
                pathID = pathID.substr(key.length+1);       //add suffix
                if(pathID.length==0){
                    folder = folder.slice(0,-1);
                    return folder;
                }
                else{
                    return folder + "/" + (pathID.replace(/\./g,"/")) + "." + ext + "?" + _getModVersion(orgPath);
                }
            }
            paths.length--;
        }
    }

    function _getPathDefPath(path){
        var refolder = "";
        for(var p in _modPath){     
            if(path==p){
                path = p;
                break;
            }
            if(path.indexOf(p + (p.slice(-1)=='/'?'':'/'))==0 && p.length > refolder){        
                refolder = p;
            }
        }
        if(refolder){
            var newFolder = _modPath[refolder];
            path = newFolder + path.substr((refolder + (refolder.slice(-1)=='/'?'':'/')).length);
        }
        return path;
    }

    function _path(pathID,ext,defaultPath){
        //console.log(pathID);
        //if(pathID=="jquery")
        //    debugger
        var modStylePath = pathID.indexOf("/") < 0;
        var retPath = pathID;
        if(modStylePath){
            //check has path set or not
            retPath = _getModDefPath(pathID,ext);
            if(!retPath){
                var retPath = defaultPath || pathID.replace(/\./g,"/") + "." + ext + "?" + _getModVersion(pathID);
                //TODO:final js add version by ?1.2.3
            }
        }
        retPath = _getPathDefPath(retPath);
        
        //default folder support for begin as ./ or xxx/ style path,no support ../ or ../../ replace
        if(_defaultFolder && (retPath.indexOf("./")==0 || retPath.substr(0,1) != "/" && retPath.indexOf("://")<0)){
            retPath = _defaultFolder + (retPath.indexOf("./")==0?retPath.substr(2):retPath);        
        }
        return retPath;
    }

    function _loadJsFinish(modID,successFn,context,scriptTag){
        scriptTag.onerror = scriptTag.onload = scriptTag.onreadystatechange = null;     //for IE memory leak
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        if (head && scriptTag.parentNode){
            head.removeChild(scriptTag);
        }              
        //sjs.loadJs -- sjs.define,sjs.run(ok),no sjs.define
        //sjs.using -- sjs.run,no sjs.define
        if(currentMod && !currentMod.id){
            if(!currentMod._setID){
                throw new Error("can not sjs.loadJs for a sjs.define file:" + modID);
            }
            currentMod._setID(modID);
            context = currentMod;
            currentMod = null;
        }
        successFn.call(context);
    }

    function _loadJs(pathID,successFn,context,modID,defaultPath){
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var scriptTag = document.createElement("script");
        scriptTag.setAttribute("type", "text/javascript");
        var path = _path(pathID,"js",defaultPath);
        scriptTag.setAttribute("src", path);
        scriptTag.setAttribute("charset", "utf-8");
        scriptTag.setAttribute("s-mod-id",modID);
        scriptTag.onload = scriptTag.onreadystatechange = function() {
            if ((!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
                //console.log("[[_laodJs finish]]",modID);
                _loadJsFinish(modID,successFn,context,scriptTag);
                scriptTag = UNDEF;                  //jquery-1.5.1 ajax clear
            }
        };
        scriptTag.onerror = function() {            //IE6,7,8,9 no fire event on error,so all check error or not in sjs.define
            console.error(modID + " failed to load(" + path + ")");            
            _loadJsFinish(modID,successFn,context,scriptTag);
            scriptTag = UNDEF;                 
        };
        head.appendChild(scriptTag);
    }

    var _loadedCss = {};
    function _loadCss(cssID){
        if(_loadedCss[cssID]){
            return;
        }
        _loadedCss[cssID] = 1;

        var path = _path(cssID,"css");
        var link = document.createElement('link');
        link.setAttribute("rel","stylesheet");
        link.setAttribute("href",path);
        link.setAttribute("type","text/css");
        link.setAttribute('charset', "utf-8");
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        //it's better to write sjs program independ on style loaded or not(E.X. get current view width or height)
        head.appendChild(link);
    }

    //from seajs
    var _currentModID;      //for combine js ,load all once
    function _getCurrentModID(){
        if (_currentModID) {
            return _currentModID;
        }
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        //IE6-10,script onload event can not fired after script content execute,but they can find current script by interactive readyState  
        var scripts = head.getElementsByTagName("script");
        for (var i = scripts.length - 1; i >= 0; i--) {
            var script = scripts[i];
            if (script.readyState == "interactive") {
                return script.getAttribute("s-mod-id");
            }
        }
    }

    var currentMod;
    function newSjs(){
        var modID = _getCurrentModID();
        if(!modID){
            currentMod = new _sjs();
            return currentMod;
        }
        else{
            return _mods[modID];
        }
    }
    
    //sjs API interface
    return {
        version:function(){
            return "0.1";
        }
        
        ,using:function(js){
            return newSjs().using(js);
        }

        ,loadJs:function(js){
            return newSjs().loadJs(js);
        }

        ,loadCss:function(css){
            return newSjs().loadCss(css);
        }

        ,define:function(fn){
            newSjs().define(fn);
        }

        ,run:function(fn){
            //newSjs().run(fn);
            fn();
        }


        
       ,pathMap:function(js,folder){
            if(folder && folder.slice(-1)!="/"){
                folder = folder + "/";
            }
            _modPath[js.toLowerCase()] = folder;
            return this;
        }

        ,pathVersion:function(js,version){
            _modVersion[js.toLowerCase()] = version;
            return this;
        }

        ,setDefaultFolder:function(folder){
            if(folder && folder.slice(-1)!="/"){
                folder = folder + "/";
            }
            _defaultFolder = folder.toLowerCase();
            return this;
        }

        ,getPath:function(path,ext){
            return _path(path.toLowerCase(),ext || "js");
        }



        //for debug and combine js
        ,_setCurrentModID:function(modID){
            _currentModID = modID;
        }

        ,_getMods:function(){
            return _mods;
        }
    };
})();