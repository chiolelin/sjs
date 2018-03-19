sjs.using(".DomHelper")
.using(".Pool")
.define(function($, pool) {
    function getHasAttr(src, attr) {
        if(typeof(src)=="string"){
            src = $(src);
        }
        var attrValue = src.attr(attr);
        if (attrValue) {
            return src;
        }
        var parents = src.parents("[" + attr + "]");
        if (parents.length) {
            var des = $(parents[0]);
            return des;
        }
        return null;
    }

    function getSjsObj(src) {
        var attr = "s6-obj-id";
        var des = getHasAttr(src,attr);
        if(des){
            return pool.get(des.attr(attr));
        }
        return null;
    }

    return {
        getHasAttr:getHasAttr
        ,getSjsObj:getSjsObj
    };
});