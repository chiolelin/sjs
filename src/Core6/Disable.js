sjs.define(function(){
	return {
        init:function(){
            this.$base();
            this.initSet("disabled");
        }

        ,disabled:false          //only self
        ,_disabled:false         //final calculate result from self and parents
		
        ,_disabledSET:function(disabled,change,oldValue,key,notifyFrom){
        	if(change){
    			disabled ? this.onDisable(notifyFrom) : this.onEnable(notifyFrom);
                for(var i=0;i<this.children.length;i++){
                    this.children[i].set("_disabled",disabled || children[i].isDisabled() || false,notifyFrom || this);
                }
            }
        }

        ,isDisabled:function(){
            return this._disabled;
        }

        ,disabledSET:function(disabled,change){
        	change && this.set("_disabled",disabled || (this.parent ? this.parent.isDisabled():false),this);
        }  

        ,disable:function(){
            return this.set("disabled",true);
        }
        
        ,enable:function(){
            return this.set("disabled",false);
        }   

        //,disabledClass:"s-disabled"
        ,onEnable:function(context){
            this.disabledClass && this.removeClass(this.disabledClass);
        }

        ,onDisable:function(context){
            this.disabledClass && this.addClass(this.disabledClass);
        }
	};
});