sjs.using(".Pool")
.using(".DomHelper")
.define(function(pool,$){
    return {
        init:function(){
            this.$base();
            this.initSet("visible",true);
        }
        
        ,visibleSET:function(visible,change){
            if(change){
                if(!visible || this.displayBlock !== "" || this.isRender()){
                    visible?this._show():this._hide();
                }
                else{
                    this.css(this.displayMode=="visible"?"visibility":"display",null);
                }
                this.isRender() && this._notifyInnerVisible(visible);
            }
        }   

        ,_show:function(){
            this.displayMode=="visible"?this.css("visibility","visible"):this.css("display",this.displayBlock || "");
        }
        
        ,_hide:function(){
            this.displayMode=="visible"?this.css("visibility","hidden"):this.css("display","none");
        }   

        ,_notifyInnerVisible:function(visible){
            var oThis = this;
            this.jq("[s6-obj-id]").each(function(){
                var innerSjsObj = pool.get($(this).attr("s6-obj-id"));
                innerSjsObj.visible && (visible ? innerSjsObj.onShow && innerSjsObj.onShow(oThis):innerSjsObj.onHide && innerSjsObj.onHide(oThis));
            });
            visible ? this.onShow && this.onShow(this):this.onHide && this.onHide(this);
        }
        
        //,displayMode:"display"      //or visible
        ,displayBlock:""              //inline-block,block,or ""
        
        ,show:function(){
            return this.set("visible",true);
        }
        
        ,hide:function(){
            return this.set("visible",false);
        }   

        ,onRender:function(context){
           this.$base(context);
           context==this && !this.visible && this._notifyInnerVisible(false);
        }
        
        //,onShow:function(context){}

        //,onHide:function(context){}
    };
});