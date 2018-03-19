sjs.using(".Pool")
.using(".DomHelper")
.define(function(pool,$){
    var OBJ_ID_NAME = "s6-obj-id";
    var OBJ_ID_NAME_JQ = "[" + OBJ_ID_NAME + "]";
	return {
        init:function(){
			this.$base();
            this._regObj();
            this._initDomID();
        }

		,_regObj:function(){
			this.objID = pool.reg(this);
        }
        
        //domID for jq
		,_initDomID:function(){
            this.domID = "s6_" + "COMP" + "_" + this.objID;
            this._jq = "#" + this.domID;
		}

		,jq:function(subExp){
            return $(this._jq + (subExp?" " + subExp:""));
        }

        ,renderTo: function(target,kind) {
            var html = this.getHtml();
            //TODO:i18n html
            var targetJq = typeof(target)=="string"?$(target):typeof(target.jq)=="function"?target.jq():target;
            if(kind == "insertBefore"){
                $(html).insertBefore(targetJq);
            }
            else if(kind == "insertAfter"){
                $(html).insertAfter(targetJq);
            }
            else if(kind == "replaceAll"){
                $(html).replaceAll(targetJq);    //WARNING:make sure no sjs objct in targetJq 
            }
            else if(kind=="prepend"){
                targetJq.prepend($(html));
            }
            else if(kind){                      //true，add end
                targetJq.append($(html));
            }
            else{                               //default:replace inner
                //WARNING:make sure targetJq no sjs object
                targetJq.html(html);
            }
            this._rendered = true;
            this._onRenderInner();
            this.onRender && this.onRender(this);
            return this;
        }

         //after render
        //,onRender:function(context){}

        ,_onRenderInner:function(jq){
            var innerObjs = [];
            this.jq((jq?jq+" ":"") + OBJ_ID_NAME_JQ).each(function(){
                var innerSjsObj = pool.get($(this).attr(OBJ_ID_NAME));
                innerObjs.push(innerSjsObj);
            });
            innerObjs.sort(function(obj1,obj2){
                return obj1.objID > obj2.objID?-1:1;      //children first render,last dispose(for no remove from parent.children)
            });
            for(var i=0;i<innerObjs.length;i++){
                innerObjs[i]._rendered = true;
                innerObjs[i].onRender && innerObjs[i].onRender(this);
            }
            return innerObjs;
        }

        ,_onDetachInner:function(jq){
            var innerObjs = [];
            this.jq((jq?jq+" ":"") + OBJ_ID_NAME_JQ).each(function(){
                var innerSjsObj = pool.get($(this).attr(OBJ_ID_NAME));
                innerObjs.push(innerSjsObj);
            });
            innerObjs.sort(function(obj1,obj2){
                return obj1.objID < obj2.objID?-1:1;      //parent first dispose
            });
            for(var i=0;i<innerObjs.length;i++){
                innerObjs[i]._rendered = false;
                innerObjs[i].onDetach && innerObjs[i].onDetach(this);
            }
            return innerObjs;
        }

        ,_disposeInner:function(jq){
            var innerObjs = this._onDetachInner(jq);
            for(var i=0;i<innerObjs.length;i++){
                innerObjs[i].dispose && innerObjs[i].dispose();
            }
            return innerObjs;
        }

        //before detach
        //,onDetach:function(context){}

        ,dispose:function(){
            this.isRender() && this._detach();
            this._unRegObj();
            this._destroy();
        }

        ,_detach:function(){
            this._rendered = false;
            this.onDetach && this.onDetach();
            this._disposeInner();
            this.jq().remove();
        }
        
        ,_unRegObj:function(){
            pool.unReg(this.objID);
        }

        ,_destroy:function(){
            for(var p in this){
                var fn = this[p];
                if(typeof(fn)=="function"){
                    this[p] = null;
                }
            }
        }

        ,isRender:function(){
            return !!this._rendered;
        }
	};
});