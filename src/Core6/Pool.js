//when component create add,destroy remove
//single ton
sjs.define({
    _objID:1000

    ,_pool:{}
    
    ,reg:function(obj) {
        this._pool[++this._objID]=obj;
        return this._objID;
    }

    ,unReg : function(objID) {
        delete this._pool[objID];
    }

    ,get : function(objID) {
        return this._pool[objID];
    }
    
    //just for debug
    ,_count:function(){
        var ret = 0;
        for(var p in this._pool){
            ret++;
        }
        return ret;
    }
});