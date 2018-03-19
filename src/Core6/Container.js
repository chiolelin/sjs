sjs.using(".Component")
.define(function(component){
	return {
        $extend:component

		,init:function(){
			this.$base();
            this.inner = this._getInner(this.inner); 
        }

        ,_setInner:function(inner){
            if(!this.isRender()){
                for(var i=0;i<this.children.length;i++){
                    this.children[i].isInnerItem && this.children[i].dispose();
                }
            }
            this.$base(inner);
        }

        ,_getInner:function(inner){
            if(typeof(inner)=="function"){
                inner = inner.call(this);
            }
            if(inner===null || typeof(inner)=="undefined"){
                inner = [];
            }
            else if(!this.isArray(inner)){
                inner = [inner];
            }
            for(var i=0;i<inner.length;i++){
                inner[i] = this._getInnerItem(inner[i]);
            }
            return inner;
        }

		,_getInnerItem:function(item){
			if(item && typeof(item)=="object"){
	            if(this.isArray(item)){
	                for(var i=0;i<item.length;i++){
	                    item[i] = this._getInnerItem(item[i]);
	                }
	            }
                else if(item.$extend && !item.$base){
                    item = this.createInnerChild(item);
                }
                //support component in tag
                else if(!item.getHtml && !item.$extend && !item.$mixin && item.inner){
                    item.inner = this._getInnerItem(item.inner);
                }
	        }
	        return item;     
		}

		,createInnerChild:function(item){
			return this.createChild(item,{isInnerItem:true});
		}
	};
});