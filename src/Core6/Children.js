sjs.using(".Cls")
.define(function(cls){
	return {
		init:function(){
			this.$base();
            //window as parent,can set as {...parent:window...}
            // if(this.parent && !this.parent.createChild){       
            //     if(this.id){
            //         this.parent[this.id] = this;
            //     }
            // }
			this.children = [];
		}


		//,layoutOnly:false      //component is layout(parent-child logic relation)

        ,createGetChild:function(childCfg,mixin1,mixin2,mixinN){
            var args = Array.prototype.slice.call(arguments,0);
            //id must in config(can not in mixin or extend)
            return this.layoutOnly ? this.parent.createGetChild.apply(this.parent,args)
                                : childCfg.id && this[childCfg.id] ? this[childCfg.id]:this._createChild(args);
        }

		,createChild:function(childCfg,mixin1,mixin2,mixinN){
            var args = Array.prototype.slice.call(arguments,0);
            return this.layoutOnly ? this.parent.createChild.apply(this.parent,args):this._createChild(args);
        }

        ,_createChild:function(args){
            var childCfg = args[0];
            //TODO:field can use expression

            //reminder why has same id,maybe memory will leak,or there will be a bug
            //this.setInner(inner,jq) in Container for jq can not check
            //childCfg.id && this[childCfg.id] && this[childCfg.id].dispose && this[childCfg.id].dispose();
            if(childCfg.id && this[childCfg.id]){
                throw new Error("id already exists:" + childCfg.id);
            }
            args.push({parent:this});

            var child = cls.create.apply(null,args);            
            if(child.id){
                this[child.id] = child;
            };
            this.children.push(child);
            return child;
        }

        ,setResponser:function(responser){
            this.responser = responser;
            return this;
        }
        
        ,report:function(evt,arg1,arg2,argN){
            var responser = this.responser || this.parent;
            if(responser){
                var args = Array.prototype.slice.call(arguments,0);                 
                //evt = this._fillEvtCustomArgs(evt,this,args);
                args.unshift(this);
                if(responser.response){
                    responser.response.apply(responser,args); //arguments:reporter,evt,arg1,arg2,argN
                }
                else{
                    var fnName = "on" + evt.substr(0,1).toUpperCase() + evt.substr(1);
                    var fn = responser[fnName];
                    if(typeof(fn)=="function"){
                        args.splice(1,1);     
                        fn.apply(responser,args);      
                    }
                }
            }
            return this;
        }

        ,disableEvent:function(evt){
            this.set(evt + "Disabled",true);
            return this;
        }

        ,enableEvent:function(evt){
            this.set(evt + "Disabled",false);
            return this;
        }

        ,responseDomEvt:function(domEvt,src,e,arg1,arg2,argN){
            if(!this.get(domEvt + "Disabled") && (!this.isDisabled() || this[domEvt + "-enabled"])){             
                var evt = src.attr("s6-" + domEvt);
                var args = Array.prototype.slice.call(arguments,0);                 
                args[0] = evt;
                args.unshift(this);     
                this.response.apply(this,args);
            }
        }
        
        ,response:function(reporter,evt,arg1,arg2,argN){
            var responser = this.responser || this.parent;
            var args = Array.prototype.slice.call(arguments,2);
            var fnName = "on" + evt.substr(0,1).toUpperCase() + evt.substr(1);
            var fn = this[fnName];
            if(typeof(fn)=="function"){
                fn.apply(this,[reporter].concat(args));
            }
            else if(responser){       
                if(responser.response){
                    responser.response.apply(responser,[reporter,evt].concat(args));
                }
                else{
                    var fn = responser[fnName];
                    if(typeof(fn)=="function"){
                        fn.apply(responser,[reporter].concat(args));
                    }
                }
            }
            return this;
        }

        ,removeFromArray:function(ary,item){
            if(ary){
                var len = ary.length;
                for(var i=0;i<len;i++){
                    if(ary[i] == item){
                        ary.splice(i,1);
                        break;
                    }
                }
            }
        }

        ,_destroyChildren:function(){
            var children = this.children;
            for(var i=0;i<children.length;i++){
                children[i].parent = null;    
                children[i].dispose && children[i].dispose();
            }
            children.length = 0;
        }
        
        ,_destroy:function(){
            this._destroyChildren();
            this.parent && this.removeFromArray(this.parent.children,this);
            if(this.parent && this.id){
                delete this.parent[this.id];
            }
            this.$base();
        }
	};
});