sjs.define(function() {
    var CHAIN_NAME="$CHAIN";                //{$CHAIN:[function(){},function(){}...]}
    var FN_METHOD_NAME = "$METHOD";         //Function.$METHOD = "onInit"
    var CALL_OVERRIDE = "$base";
    var GET_CALL_OVERRIDE = "$getBase";
    
    function callOverride() {
        var callFn=this[CALL_OVERRIDE].caller;  //arguments.callee.caller;     //who call this.$base()
        var baseFn = _getOverrideFn.call(this,callFn);
        //inner() can override inner:[],and this.$base() return baseInner
        return typeof(baseFn)=="function"?
            baseFn.apply(this,Array.prototype.slice.call(arguments,0)):baseFn;
    }

    function getOverrideFn(){
        var callFn=this[GET_CALL_OVERRIDE].caller;
        return _getOverrideFn.call(this,callFn);
    }

    function _getOverrideFn(callFn) {
        if(!this[CHAIN_NAME]){
            return;
        }
        var fnName = callFn[FN_METHOD_NAME];
        if(!fnName){
            return;
        }
        var fnChain = this[CHAIN_NAME][fnName];
        if(!fnChain || !fnChain.length){
            return;
        }
        var currentFn = null;
        if(this[fnName] == callFn){                         
            currentFn = fnChain[fnChain.length - 1];        
        }
        else{
            //apply has promise one function never add twice
            for(var i=fnChain.length-1;i>=0;i--){
                if(fnChain[i] == callFn){
                    if(i>=1){
                        currentFn = fnChain[i-1];
                    }
                    break;
                }
            }
        }
        return currentFn;
    }
    
    function addIfNotExist(ary,items){
        for(var i=0;i<items.length;i++){
            if(items[i]){
                var exist = false;
                for(var j=0;j<ary.length;j++){
                    if(ary[j]==items[i]){
                        exist = true;
                        break;
                    }
                }
                if(!exist){
                    ary.push(items[i]);
                }
            }
        }
    }
    
    function removeExists(ary,baseFn){
        for(var i=0;i<ary.length;i++){
            if(ary[i]==baseFn){
                ary.splice(i,1);
                break;
            }
        }
    }

    function apply(ret,c) {
        if(c) {
            for(var p in c) {
                if(p.substr(0,1) == "$"){        //meta data,no copy
                    continue;
                }
                //if function and (exist or has chain) we make the function chain
                if(typeof(c[p])=='function' && (typeof(ret[p])!= 'undefined' || c[CHAIN_NAME] && c[CHAIN_NAME][p])){
                    if(!ret[CHAIN_NAME]){
                        ret[CHAIN_NAME]={};
                    }
                    if(!ret[CHAIN_NAME][p]){
                        ret[CHAIN_NAME][p]=[];        
                    }
                    if(c[p][FN_METHOD_NAME] && c[p][FN_METHOD_NAME]!=p){
                        throw new Error("method has two name:" + p + "," + c[p][FN_METHOD_NAME]);
                    }
                    c[p][FN_METHOD_NAME] = p;
                    if(typeof(ret[p])=='function'){
                        ret[p][FN_METHOD_NAME] = p;     
                    }

                    //ret[p] first,then c.$CHAIN[p]
                    if(typeof(ret[p])!='undefined'){
                        addIfNotExist(ret[CHAIN_NAME][p],[ret[p]]);
                    }
                    if(c[CHAIN_NAME] && c[CHAIN_NAME][p]){
                        addIfNotExist(ret[CHAIN_NAME][p],c[CHAIN_NAME][p]);
                    }
                    //function no need repeat
                    removeExists(ret[CHAIN_NAME][p],c[p]);
                }
                else if(ret[CHAIN_NAME] && ret[CHAIN_NAME][p]){
                    delete ret[CHAIN_NAME][p];
                }
                ret[p]=c[p];
            }
            ret[CALL_OVERRIDE]=callOverride;
            ret[GET_CALL_OVERRIDE]=getOverrideFn;
        }

        var args=Array.prototype.slice.call(arguments,2);
        if(args.length>0) {
            for(var i=0;i<args.length;i++){
                apply(ret,args[i]);
            }
        }
        return ret;
    }
    
    function copyChain(chain){
        var ret = {};
        for(var fnName in chain){
            ret[fnName]=[].concat(chain[fnName]);
        }
        return ret;
    }

    function mixin(o,c) {
        var ret={};
        for(var p in o) {
            if(p==CHAIN_NAME) {        //deep copy chain
                ret[p] = copyChain(o[p]);
            }
            else if(p.substr(0,1) == "$"){        
                continue;
            }
            else{
                ret[p]=o[p];
            }
        }
        var args=Array.prototype.slice.call(arguments,1);
        if(args.length>0){
            args.unshift(ret);
            apply.apply(null,args);
        }
        return ret;
    }

    var EXTEND = "$extend";                
    var MIXIN = "$mixin";                  
    var DEFINE_CACHE = "$DEFINE_CACHE";       
    var CLASS_CACHE = "$CLASS_CACHE";   
    function define(typeCfg){
        var ret;
        if(!typeCfg[EXTEND] && !typeCfg[MIXIN]){
            ret = typeCfg;
        }
        else if(typeCfg[DEFINE_CACHE]){
            ret = typeCfg[DEFINE_CACHE];
        }
        else{
            var mixes = [];
            var extend = typeCfg[EXTEND];              
            if(extend){
                mixes.push(define(extend));
            }
            var mixins = [].concat(typeCfg[MIXIN]);
            for(var i=0;i<mixins.length;i++){
                mixins[i] && mixes.push(define(mixins[i]));    
            }
            mixes.push(typeCfg);
            var ret = mixin.apply(null,mixes);
            typeCfg[DEFINE_CACHE] = ret;                  //cache
        }
        return ret;
    }
    
    function create(cfg,mixin1,mixin2,mixinN){
        var typeDefine = cfg[EXTEND];       
        var type = define(typeDefine);                  //need $extend
        var cls = type[CLASS_CACHE];
        if(!cls){
            cls = function(mixins,config){
                this[CHAIN_NAME] = copyChain(this[CHAIN_NAME]);    
                var applies = [this];
                for(var i=0;i<mixins.length;i++){
                    mixins[i] && applies.push(define(mixins[i]));
                }
                applies.push(config);      
                apply.apply(null,applies);
                this.init && this.init();
            }
            cls.prototype = type;
            type[CLASS_CACHE] = cls;
        }
        var args = Array.prototype.slice.call(arguments,1);
        var mixins = [].concat(cfg[MIXIN]).concat(args);
        var ret = new cls(mixins,cfg);
        return ret;
    }

    return {
        create : create            
        ,define : define
    };
});