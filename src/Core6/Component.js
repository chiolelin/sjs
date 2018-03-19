sjs.using(".LifeCycle")
.using(".Data")
.using(".Disable")
.using(".Visible")
.using(".Children")
.using(".GetHtml")
.using(".ClickEvent")       //default response s6-click
.define(function(lifeCycle,data,disable,visible,children,getHtml){
	return {
		$extend:lifeCycle
        ,$mixin:[data,disable,visible,children,getHtml]
        
        //connect lifecycle and dom event
        ,init:function(){
            this.$base();
            this.attr("id",this.domID);
            this.attr("s6-obj-id",this.objID);
		}

        ,setInner:function(inner,jq){
            this.isRender() && this._disposeInner(jq); 
            if(jq){
                inner = this._getInner(inner);
            }
            else{
                this._setInner(inner);
                inner = this.inner;
            }
            this.isRender() && this._renderInner(inner,jq);
        }

        ,_setInner:function(inner){
            this.inner = this._getInner(inner);
        }

        ,_getInner:function(inner){
            return inner;
        }

        //kind:insertBefore,insertAfter,replaceAll,prepend,append,undefined=html
        ,_renderInner:function(inner,jq){
            var html = this.innerHtml(inner);     
            this.jq(jq).html(html);
            this._onRenderInner(jq);           
        }

		,attr:function(k,v,jq){
            if(this.isRender()){
                typeof(v)=="boolean"?this.jq(jq).prop(k,v):this.jq(jq).attr(k,v);
            }
            else if(!jq){
                if(typeof(k)=="object"){       
	                for(var p in k){
	                    if(k[p]!==null){
	                        this[":" + p] = k[p];
	                    }
	                }
	            }
	            else{
	                this[":"+k]=v;             
	            }
            }
            return this;
        }
        
        ,css:function(k,v,jq){
            if(this.isRender()){
                this.jq(jq).css(k,v);
            }
            else if(!jq){
                if(typeof(k)=="object"){
	                for(var p in k){
	                    if(k[p]!==null){
	                        this[";" + p] = k[p];
	                    }
	                }
	            }
	            else{
	                this[";"+k]=v;
	            }            
            }
            return this;
        }
        
        ,addClass:function(k,jq){
            this.isRender() ? this.jq(jq).addClass(k) :!jq ?(this["." + k] = true):"";
            return this;
        }
        
        ,removeClass:function(k,jq){
            this.isRender() ? this.jq(jq).removeClass(k) :!jq ?(this["." + k] = false):"";
            return this;
        }

        ,setClass:function(k,v,jq){
            return v ? this.addClass(k,jq) : this.removeClass(k,jq);
        }   

	};
});