sjs.define(function(){
    return {
        addBind:function(fields,bind){
            var binds = this._bindMe = this._bindMe || {};
            for(var i=0;i<fields.length;i++){
                var field = fields[i];
                var fieldBinds = binds[field];
                if(!fieldBinds){
                    fieldBinds = binds[field] = [];
                }
                fieldBinds.push(bind);
            }
        }
        
        ,removeBind:function(bind){
            var binds = this._bindMe;
            if(binds){
                for(var field in binds){
                    var fieldBinds = binds[field];
                    for(var i=fieldBinds.length-1;i>=0;i--){
                        if(fieldBinds[i]==bind){
                            fieldBinds.splice(i,1);
                            break;
                        }
                    }
                }              
            }
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
        
        
        ,notifySet:function(key,value,change,oldValue,notifyFrom){
            this.$base(key,value,change,oldValue,notifyFrom);
            var binds = this._bindMe;
            if(binds){
                var applyedBinds = {};
                var noticeBinds = {};
                for(var bindField in binds){
                    var fieldBinds = binds[bindField];
                    if(key==bindField || (bindField + ".") .indexOf(key + ".")==0){  
                        for(var i=0;i<fieldBinds.length;i++){
                            var target = fieldBinds[i].target;
                            var bind = fieldBinds[i];                        
                            if(!applyedBinds[bind.id] && !this._bindIsApply(bind.id,notifyFrom)){
                                applyedBinds[bind.id] = 1;      
                                target.applyBind(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                            }
                        }
                    }
                    else if((key + ".") .indexOf(bindField + ".")==0){        
                        for(var i=0;i<fieldBinds.length;i++){
                            var target = fieldBinds[i].target;
                            var bind = fieldBinds[i];
                            if(!noticeBinds[bind.id] && !this._bindIsApply(bind.id,notifyFrom)){
                                noticeBinds[bind.id] = 1;
                                var targetKey = bind.key + "." + key.substr(bindField.length + 1);
                                if(bind.kind=="set" && !bind.from){
                                    target.notifySet(targetKey,value,change,oldValue,{bindID:bind.id,notifyFrom:notifyFrom});       //change為true，因為對于當前對象來說，數據確實有改變
                                }
                                else{
                                    target.applyBind(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                                }
                            }
                        }
                    }       
                }
            }
        }
        
        ,_adjustBindsIndexSource:function(key,index,addOrRemove){
            var binds = this._bindMe;
            if(binds){
                var tmpOldKeys = [];        
                var tmpNewKeyBinds = {};    
                var tmpRemoveBinds = [];    
                for(var bindField in binds){
                    var fieldBinds = binds[bindField];
                    
                    if(bindField!=key && (bindField + ".").indexOf(key + ".")==0){            
                        var fields = bindField.split(".");
                        var fieldIndex = key.split(".").length;            
                        var curBindIndex = parseInt(fields[fieldIndex]);
                        if(curBindIndex >= index){   
                            if(curBindIndex == index && addOrRemove =="remove"){    
                                for(var i=0;i<fieldBinds.length;i++){
                                    var bind = fieldBinds[i];
                                    tmpRemoveBinds.push(bind);
                                }                             
                            }
                            else{
                                fields[fieldIndex] = addOrRemove=="add"?curBindIndex + 1:curBindIndex-1;
                                var newKey = fields.join(".");                  
                                for(var i=0;i<fieldBinds.length;i++){
                                    var bind = fieldBinds[i];   
                                    
                                    var isParent = bind.target == this.parent;
                                    for(var j=0;j<bind.fields.length;j++){
                                        if(bind.fields[j].substr(isParent?0:1) == bindField){
                                            bind.fields[j] = (isParent?"":"@") + newKey;
                                            break;
                                        }
                                    }

                                } 
                                tmpNewKeyBinds[newKey] = fieldBinds;           
                            }
                            tmpOldKeys.push(bindField);
                        }
                    }                 
                }       

                for(var i=0;i<tmpRemoveBinds.length;i++){
                    this.removeBind(tmpRemoveBinds[i]);
                }
                for(var i=0;i<tmpOldKeys.length;i++){
                    delete this._bindMe[tmpOldKeys[i]];
                } 
                for(var p in tmpNewKeyBinds){
                    this._bindMe[p] = tmpNewKeyBinds[p];
                }
            }
        }
        
        ,notifyAdd:function(key,items,index,item,notifyFrom){
            this._adjustBindsIndexSource(key,index,"add");       
            this.$base(key,items,index,item,notifyFrom);
            var binds = this._bindMe;
            if(binds){
                for(var bindField in binds){
                    var fieldBinds = binds[bindField];
                    if(key==bindField || (key + ".") .indexOf(bindField + ".")==0){       
                        for(var i=0;i<fieldBinds.length;i++){
                            var target = fieldBinds[i].target;
                            var bind = fieldBinds[i];
                            if(!this._bindIsApply(bind.id,notifyFrom)){
                                if(bind.kind=="set" && !bind.from){
                                    var targetKey = bind.key + (key==bindField?"":"." + key.substr(bindField.length + 1));
                                    target.notifyAdd(targetKey,items,index,item,{bindID:bind.id,notifyFrom:notifyFrom});
                                }
                                else{
                                    target.applyBind(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                                }
                            }
                        }
                    }       
                }            
            }
        }
                
        ,notifyRemove:function(key,items,index,oldItem,notifyFrom){
            this._adjustBindsIndexSource(key,index,"remove");        
            this.$base(key,items,index,oldItem,notifyFrom);
            var binds = this._bindMe;
            if(binds){
                for(var bindField in binds){
                    var fieldBinds = binds[bindField];
                    if(key==bindField || (key + ".") .indexOf(bindField + ".")==0){        
                        for(var i=0;i<fieldBinds.length;i++){
                            var target = fieldBinds[i].target;
                            var bind = fieldBinds[i];
                            if(!this._bindIsApply(bind.id,notifyFrom)){
                                if(bind.kind=="set" && !bind.from){
                                    var targetKey = bind.key + (key==bindField?"":"." + key.substr(bindField.length + 1));
                                    target.notifyRemove(targetKey,items,index,oldItem,{bindID:bind.id,notifyFrom:notifyFrom});
                                }
                                else{
                                    target.applyBind(bind,{bindID:bind.id,notifyFrom:notifyFrom});
                                }
                            }
                        }
                    }       
                }  
            }
        }
    };
});