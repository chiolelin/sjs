sjs.define(function(UNDEF){
    var bindSeed = 1001;
    return {
        init:function(){
            this._binds = {};           //{key:bind}
            this._scanBinds();          
            this.$base();
        }
        
        ,initSet:function(key,defaultValue){
            var bindSet = this[key + "~"] || this[key + "<"];
            if(!(bindSet && typeof(bindSet)=="string")){      
                this.$base(key,defaultValue);
            }
        }

        ,_getBindKind:function(key){
            return key.slice(0,-1)=="inner"?"inner":({";":"css",":":"attr",".":"setClass"}[key.substr(0,1)] || "set");
        }
          
        ,_scanBinds:function(){
            for(var p in this){
                var pValue = this[p];
                var pType = typeof(pValue);
                var bindWay = p.slice(-1);
                //"@value":"data.start_time,data.end_time"
                if((bindWay=="~" || bindWay==">" || bindWay=="<") && pType=="string"){
                    var bindKind = this._getBindKind(p);
                    if(bindKind=="set"){
                        var pName = p.slice(0,-1);
                        var bindBackFn = this[pName + "BINDBACK"];
                        var bindFromFn = this[pName + "BINDFROM"];
                        this._bind(bindWay,bindKind,pName,pValue,bindFromFn,bindBackFn);
                    }
                }
            }
        }

        ,_tagKey:function(tag,tagKey,html,tagAttrs){
	        var pValue = tag[tagKey];
            var pType = typeof(pValue);
            var bindWay = tagKey.slice(-1);
            if((bindWay=="~" || bindWay==">" || bindWay=="<") && pType=="string"){
                var bindKind = this._getBindKind(tagKey);
                if(bindKind!="set"){
                    var isThis = tag==this;
                    if(!isThis){
                        if(!tag.id){
                            this._tagIdSeed = this._tagIdSeed || 1001;
                            tag.id = this.domID + "-bind-" + (this._tagIdSeed++);
                        }
                        html.push(' id="' + tag.id + '"'); 
                    }
                    var pName = tagKey.slice(0,-1);
                    var bindFromFn = tag[pName + "BINDFROM"];
                    this._bind(bindWay,bindKind,pName,pValue,bindFromFn,isThis?"":"#" + tag.id);
                }
            }
            else{
                this.$base(tag,tagKey,html,tagAttrs);
            }
        }

        ,onRender:function(context){
            this.$base(context);
            console.log("[onRender,_applyViewBinds]");
            this.applyViewBinds();
            console.log("[onRender,_applyViewBinds--OK]");
        }

        ,_renderInner:function(inner,jq){
            this.$base(inner,jq);
            console.log("[_renderInner,_applyViewBinds]",jq);
            this.applyViewBinds(jq);
            console.log("[_renderInner,_applyViewBinds--OK]",jq);
        }

        ,applyViewBinds:function(jq,addSelf){
            for(var key in this._binds){
                var bind = this._binds[key];
                if(bind.kind != "set" && bind.jq){
                    (
                        this.jq(jq).find(bind.jq).length
                         || jq && addSelf && this.jq(jq)[0] == this.jq(bind.jq)[0]
                    ) && this.applyBind(bind);
                }
            }
        }

        ,unbindViewBinds:function(jq,addSelf){
            for(var key in this._binds){
                var bind = this._binds[key];
                //if jq null,remove all in this(no contain this self)
                //but if jq is not null,remove all in jq(contain jq self)
                if(bind.kind != "set" && bind.jq){
                    (
                        this.jq(jq).find(bind.jq).length
                         || jq && addSelf && this.jq(jq)[0] == this.jq(bind.jq)[0]
                    ) && this.unBind(key);
                }
            }
        }

        ,_disposeInner:function(jq){
            console.log("[_disposeInner,_unbindViewBinds]",jq);
            this.unbindViewBinds(jq);
            console.log("[_disposeInner,_unbindViewBinds--OK]",jq);
            this.$base(jq);
        }

        ,_getBindFnFromExp:function(bindExp){
            var expVarReg = /@{1,2}[a-zA-Z_][\w.]*/g;
            var fields = [];
            var str = bindExp.replace(expVarReg,function(field){
                var index = -1;
                for(var i=0;i<fields.length;i++){
                    if(fields[i] == field){
                        index = i;
                        break;
                    }
                }
                if(index==-1){
                    index = fields.length;
                    fields.push(field);
                }
                return "f" + index;
            });
            var fnArgs = [];
            for(var i=0;i<fields.length;i++){
                fnArgs.push("f" + i);
            }
            fnArgs.push("return " + str);
            return {
                fn:Function.constructor.apply(null,fnArgs)
                ,fields:fields.join(",")
            };
        }

        ,_bind:function(bindWay,bindKind,key,fieldStr,bindFromFn,jqOrbindBackFn){
            var bindApplyKey = key;
            var jq;
            var bindBackFn;
            if(bindKind != "set"){
                bindApplyKey = key=="inner"?key:key.substr(1);        
                jq = jqOrbindBackFn || "";
            }
            else{
                bindBackFn = jqOrbindBackFn;
            }
            var bindParentFields = [];      
            var bindSelfFields = [];        

            if(fieldStr.indexOf("@")>=0){
                var parseRet = this._getBindFnFromExp(fieldStr);
                if(parseRet.fields!=fieldStr){
                    bindFromFn = bindFromFn || parseRet.fn;
                    fieldStr = parseRet.fields;
                }
            }


            var fields = fieldStr.split(",");   
            for(var i=0;i<fields.length;i++){
                var field = fields[i];
                var isParent = field.indexOf("@@")==0 || field.indexOf("@")<0;
                var bindFields = isParent?bindParentFields:bindSelfFields;
                var realField = field.substr(!isParent?1:field.indexOf("@@")==0?2:0);      //parent:field1,self:field2
                fields[i] = isParent?realField:"@" + realField;                         //parent:field1,self:@field2
                bindFields.push(realField);
            }

            this._bindIdSeed = this._bindIdSeed || 1;
            var bind = {
                id:"bind-" + (bindSeed++)       
                ,way:bindWay                //~,>,<
                ,key:key + (jq || "")       //value,;color,:title,.font-bold,inner#s6_COMP_5-bind-2
                ,applyKey:bindApplyKey      //value,color,title,font-bold,inner
                ,kind:bindKind              //set,css,attr,setClass,inner
                ,fields:fields              //[parent1,parent2,@self]
                ,from:bindFromFn            //from function
                ,back:bindBackFn            //back function
                ,bindParent:!!bindParentFields.length
                ,bindSelf:!!bindSelfFields.length
                ,jq:jq                      //jq for css,attr,setClass,inner
                ,target:this
            };  
            this._binds[bind.key] = bind;

            //"item>":"form"            //only write to parent(this one no sample.E.X. PCI.CTS.List.Main)
            if(bindWay != ">"){
                if(bindParentFields.length){
                    if(!this.parent || !this.parent.addBind){
                        throw new Error("parent must mixin Core6.Bind.Source:" + key + bindWay + ":" + this[key+bindWay]);
                    }
                    this.parent.addBind(bindParentFields,bind);
                }
            
                if(bindSelfFields.length){
                    if(!this.addBind){
                        throw new Error("self must mixin Core6.Bind.Source:" + key + bindWay + ":" + this[key+bindWay]);
                    }
                    this.addBind(bindSelfFields,bind);
                }

            }
            console.log("~bind~",bind.key,":",fieldStr);
            return bind;
        }
               
        ,applyBind:function(bind,bindFrom){
            var bindValue = this._getBindValue(bind);
            if(bind._lastValue === bindValue && bind.kind!="set"){
                return;
            }
            if(bind.kind == "set"){
                this.set(bind.applyKey,bindValue,bindFrom);       
                console.log("（apply bind）:",bind.key,bindValue);
            }
            else if(!bind.jq || this.isRender()){
                if(bind.kind=="inner"){
                    this.setInner(bindValue,bind.jq);
                }
                else {
                    var fn = this[bind.kind];
                    fn.call(this,bind.applyKey,bindValue,bind.jq);
                }
                console.log("（apply bind）:",bind.key,bindValue);
                bind._lastValue = bindValue;
            }
        }
        
        ,_getBindValue:function(bind){
            var args = bind.fields;
            var argValues = [];
            for(var i=0;i<args.length;i++){
                var arg = args[i];
                if(arg.indexOf("@")==0){
                    argValue = this.get(arg.substr(1));
                }
                else{
                    argValue = this.parent.get(arg);
                }
                argValues.push(argValue);
            }
            var fn = bind.from;
            if(typeof(fn)=="function"){
                return fn.apply(this,argValues);
            }
            else if(args.length>1){
                return argValues;           
            }
            else{
                return argValues[0];
            }
        }
                
        ,_destroy:function(){
            if(this.parent){                //if no parent,no need remove bind from parent
                for(var key in this._binds){
                    var bind = this._binds[key];
                    if(bind.way != ">" && bind.bindParent){
                        this.parent.removeBind(bind);
                    }
                }
            }
            this.$base();
        }

        ,unBind:function(key,jq){
            var bind = this._binds[key + (jq || "")];
            if(bind.way != ">"){
                bind.bindParent && this.parent.removeBind(bind);
                bind.bindSelf && this.removeBind(bind);
            }
            delete this._binds[key];
            console.log("-unbind-",bind.key,":",bind.fields.join(","));

        }

        ,bind:function(bindWay,bindKind,key,fieldStr,bindFromFn,jqOrbindBackFn){
            this.unBind(key,jqOrbindBackFn && typeof(jqOrbindBackFn)!="function"?jqOrbindBackFn || "":"");                   //先去除key
            var bind = this._bind(bindWay,bindKind,key,fieldStr,bindFromFn,jqOrbindBackFn);
            this.isRender() && this.applyBind(bind);                  
        }

        ,_bindIsApply:function(bindID,notifyFrom){
            while(notifyFrom){
                if(notifyFrom.bindID == bindID){
                    return true;
                }
                notifyFrom = notifyFrom.notifyFrom;
            }
            return false;
        }

        ,_bindBack:function(bind,notifyFrom){
            var bindValue = this.get(bind.key);
            if(typeof(bind.back)=="function"){
                bindValue = bind.back.call(this,bindValue);
            }
            bindValue = bind.fields.length > 1?bindValue:[bindValue];
            for(var i=0;i<bind.fields.length;i++){
                var bindField = bind.fields[i];
                var source = bindField.indexOf("@")==0?this:this.parent;
                source.set(bindField.indexOf("@")==0?bindField.substr(1):bindField,bindValue[i],notifyFrom);
            }
        }

        ,notifySet:function(key,value,change,oldValue,notifyFrom){
            this.$base(key,value,change,oldValue,notifyFrom);
            
            var binds = this._binds;
            for(var bindKey in binds){
                var bind = binds[bindKey];
                if(bind.way == "<" || this._bindIsApply(bind.id,notifyFrom)){
                    continue;
                }

                if(key==bindKey || (bindKey + ".") .indexOf(key + ".")==0 || ((key + ".") .indexOf(bindKey + ".")==0 && bind.back)){ 
                    this._bindBack(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                }
                else if((key + ".") .indexOf(bindKey + ".")==0 && !bind.back){
                    if(bind.fields.length==1){
                        var bindField = bind.fields[0];
                        var source = bindField.indexOf("@")==0?this:this.parent;
                        var realField = bindField.indexOf("@")==0?bindField.substr(1):bindField;
                        var targetKey = realField + "." + key.substr(bindKey.length + 1);
                        source.notifySet(targetKey,value,{bindID:bind.id,notifyFrom:notifyFrom});
                    }
                }       
            }
        }
        
        ,_adjustBindsIndexTarget:function(key,index,addOrRemove){
            var tmpOldKeys = [];       
            var tmpNewKeyBinds = {};    
            var tmpRemoveBinds = [];    
            var binds = this._binds;
            for(var bindKey in binds){
                var bind = binds[bindKey];
                if(bindKey!=key && (bindKey + ".").indexOf(key + ".")==0){            
                    var fields = bindKey.split(".");
                    var fieldIndex = key.split(".").length;             
                    var curBindIndex = parseInt(fields[fieldIndex]);
                    if(curBindIndex >= index){   
                        if(curBindIndex == index && addOrRemove =="remove"){    
                            tmpRemoveBinds.push(bind);
                        }
                        else{
                            fields[fieldIndex] = addOrRemove=="add"?curBindIndex + 1:curBindIndex-1;
                            var newKey = fields.join(".");                  
                            bind.key = bind.applyKey = newKey;
                            tmpNewKeyBinds[newKey] = bind;             
                        }
                        tmpOldKeys.push(bindKey);
                    }
                }                 
            }       
            for(var i=0;i<tmpRemoveBinds.length;i++){
                this.unBind(bind.key);
            }
            for(var i=0;i<tmpOldKeys.length;i++){
                delete this._binds[tmpOldKeys[i]];
            } 
            for(var p in tmpNewKeyBinds){
                this._binds[p] = tmpNewKeyBinds[p];
            }
        }
        
        ,notifyAdd:function(key,items,index,item,notifyFrom){
            this._adjustBindsIndexTarget(key,index,"add");
            this.$base(key,items,index,item,notifyFrom);

            var binds = this._binds;
            for(var bindKey in binds){
                var bind = binds[bindKey];
                if(bind.way == "<" || this._bindIsApply(bind.id,notifyFrom)){
                    continue;
                }
                if(key==bindKey || (key + ".") .indexOf(bindKey + ".")==0){        
                    if(!bind.back && bind.fields.length==1){
                        var bindField = bind.fields[0];
                        var source = bindField.indexOf("@")==0?this:this.parent;
                        var realField = bindField.indexOf("@")==0?bindField.substr(1):bindField;
                        var targetKey = key==bindKey?realField:realField + "." + key.substr(bindKey.length + 1);
                        source.notifyAdd(targetKey,items,index,item,{bindID:bind.id,notifyFrom:notifyFrom});
                    }
                    else{
                        this._bindBack(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                    }
                }
            }            
        }
                
        ,notifyRemove:function(key,items,index,oldItem,notifyFrom){
            this._adjustBindsIndexTarget(key,index,"remove");        
            this.$base(key,items,index,oldItem,notifyFrom);
            var binds = this._binds;
            for(var bindKey in binds){
                var bind = binds[bindKey];
                if(bind.way == "<" || this._bindIsApply(bind.id,notifyFrom)){
                    continue;
                }
                if(key==bindKey || (key + ".") .indexOf(bindKey + ".")==0){           
                    if(!bind.back && bind.fields.length==1){
                        var bindField = bind.fields[0];
                        var source = bindField.indexOf("@")==0?this:this.parent;
                        var realField = bindField.indexOf("@")==0?bindField.substr(1):bindField;
                        var targetKey = key==bindKey?realField:realField + "." + key.substr(bindKey.length + 1);
                        source.notifyRemove(targetKey,items,index,oldItem,{bindID:bind.id,notifyFrom:notifyFrom});
                    }
                    else{
                        this._bindBack(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                    }
                }
            }  
        }
    };
});