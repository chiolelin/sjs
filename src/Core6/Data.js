sjs.define(function(){
    var NUM_KEY_REG = /\.\d+(\.|$)/g;
	return {
        initSet:function(key,defaultValue){
            typeof(this[key])=="undefined" ? this.set(key,defaultValue) : this.notifySet(key,this[key],true);
        }

        ,set:function(key,value,notifyFrom){
            var oldValue = this.get(key);
            var change = oldValue !== value;
            change && this._set(key,value,notifyFrom);
            this.notifySet(key,value,change,oldValue,notifyFrom);
            return this;
        }

        ,_set:function(key,value,notifyFrom){
            var paths = key.split(".");
            if(paths.length==1){
                if(typeof(value)=="undefined"){
                    delete this[key];
                }
                else{
                    this[key] = value;  
                }    
            }
            else{
                var ret = this;
                for(var i=0;i<paths.length;i++){
                    var path = !isNaN(paths[i])?parseInt(paths[i]):paths[i];
                    if(i==paths.length-1){
                        if(typeof(value)=="undefined"){
                            delete ret[path];
                        }
                        else{
                            ret[path] = value;  
                        }   
                    }
                    else{
                        if(ret[path] === null || typeof(ret[path])=="undefined"){
                            var curIsArray = !isNaN(paths[i+1]);    
                            var oldValue = ret[path];       
                            ret[path] = curIsArray?[]:{};
                            var curKey = paths.slice(0,i+1).join(".");
                            this.notifySet(curKey,ret[path],true,oldValue,notifyFrom);
                        }
                        ret = ret[path];
                     }
                }
            }        
        }
        
        ,notifySet:function(key,value,change,oldValue,notifyFrom){
            var fnKey = key.replace(NUM_KEY_REG,"..");            //clear number
            var byFn = this[fnKey + "SET"];       
            byFn && byFn.call(this,value,change,oldValue,key,notifyFrom);
            this.dataSetEvt && this.report(this.dataSetEvt,fnKey,value,change,oldValue,key,notifyFrom);
            /* add on bind
            //if array,notifySet xxx-LEN 
            if(this.isArray(oldValue) || this.isArray(value)){
                var oldLength = this.isArray(oldValue)?oldValue.length:0;
                var newLength = this.isArray(value)?value.length:0;
                this.notifySet(key + "-LEN",newLength,newLength!=oldLength,oldLength,notifyFrom);
            }
            */
        }        
                
        ,get:function(key){
            return this._get(this,key);
        }

        ,_get:function(obj,key){
            var paths = key.split(".");
            var ret = obj[paths[0]];      
            for(var i=1;i<paths.length;i++){ 
                if(!ret){
                    return;     
                }
                var path = !isNaN(paths[i])?1 * paths[i]:paths[i];
                ret = ret[path];
            }
            return ret;
        }

        ,add:function(key,item,index,notifyFrom){
            var items = this.get(key);
            if(!items){
                this.set(key,[item],notifyFrom);
            }
            else{
                if(typeof(index)=="number" && index>=0 && index < items.length){
                    items.splice(index,0,item);
                }
                else{
                    index = items.length;
                    items.push(item);
                }
                this.notifyAdd(key,items,index,item,notifyFrom);    
            }
            return this;
        }
        
        ,notifyAdd:function(key,items,index,item,notifyFrom){
            var fnKey = key.replace(NUM_KEY_REG,"..");          
            var byFn = this[fnKey + "ADD"];
            byFn && byFn.call(this,items,index,item,key,notifyFrom);
            this.dataAddEvt  && this.report(this.dataAddEvt,fnKey,items,index,item,key,notifyFrom);

            //this.notifySet(key + "-LEN",items.length,true,items.length-1,notifyFrom);
        }
                
        ,remove:function(key,item,notifyFrom){
            var items = this.get(key);
            if(items){
                var index = -1;
                for(var i=0;i<items.length;i++){
                    if(items[i]===item){
                        index = i;
                        break;
                    }
                }
                this.removeAt(key,index,notifyFrom);
            }
            return this;
        }
                
        ,removeAt:function(key,index,notifyFrom){
            var items = this.get(key);
            if(items){
                if(index>=0 && index<items.length){
                    var oldItem = items[index];
                    items.splice(index,1);
                    this.notifyRemove(key,items,index,oldItem,notifyFrom);
                }
            }
            return this;
        }
        
        ,notifyRemove:function(key,items,index,oldItem,notifyFrom){
            var fnKey = key.replace(NUM_KEY_REG,"..");           
            var byFn = this[fnKey + "REMOVE"];
            byFn && byFn.call(this,items,index,oldItem,key,notifyFrom);
            this.dataRemoveEvt && this.report(this.dataRemoveEvt,fnKey,items,index,oldItem,key,notifyFrom);

            //this.notifySet(key + "-LEN",items.length,true,items.length+1,notifyFrom);
        }

        //batchAction for UI can adjust self
        //addItems:function(){}
        //removeItems:function(){}
        //moveItem:function(){}
        //batchSet:({})
	}
})