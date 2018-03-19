sjs.using(".DomHelper")
.using(".GetHelper")
.define(function($, getHelper) {
    function onclick(e){
        var src = $(this);
        var sjsObj = getHelper.getSjsObj(src);
        sjsObj && sjsObj.responseDomEvt && sjsObj.responseDomEvt("click",src,e);
    }

    $(document).delegate("[s6-click]","click",onclick);
});    