sjs.define(function(){
	return {
		getHtml:function(context,html){
            var joinHtmlReturn = !html;
            html = html || [];
            this.tagHtml(this,html);
            if(joinHtmlReturn){
                return html.join("");
            }
        }

		,tagHtml:function(tag,html){
			var joinHtmlReturn = !html;
            html = html || [];
			var tagName = tag.tag || "div";
	        html.push("<");
	        html.push(tagName);
	        tag.attribute && html.push(" " + tag.attribute);
            var tagAttrs = {styleHtml:[],classes:[]};//,styleStr:"",classStr:""};
	        for(var tagKey in tag) {
                this._tagKey(tag,tagKey,html,tagAttrs);
	        }
	        if(tagAttrs.styleStr || tagAttrs.styleHtml.length){
	            html.push(' style="' + (tagAttrs.styleStr || "") + (tagAttrs.styleStr && tagAttrs.styleHtml.length?";":"") + tagAttrs.styleHtml.join(";") + '"');
	        }
	        if(tagAttrs.classStr || tagAttrs.classes.length){
	            html.push(' class="' + (tagAttrs.classStr || "") + (tagAttrs.classStr && tagAttrs.classes.length?" ":"") + tagAttrs.classes.join(" ") + '"');
	        }
			var tagNoInner = tag.inner===null || !(typeof(tag.inner)!="undefined" || tag.innerHtml);        //img,input to component?
	        tagNoInner && html.push(" /");
	        html.push(">");
	        if(!tagNoInner){
                this.innerHtml(tag.inner,html);
	            html.push("</" + tagName + ">");
			}
            if(joinHtmlReturn){
                return html.join("");
            }
		}

        //{styleHtml:[],classes:[],styleStr:"",classStr,html:html}
        ,_tagKey:function(tag,tagKey,html,tagAttrs){
            var firstCode = tagKey.substr(0,1);
	        var pValue = tag[tagKey];
	        var pType = typeof(pValue);
	        if(pType != "undefined" && pValue !== null && (firstCode==";" || firstCode=="." || firstCode==":")){
				//TODO:pValue can use expression

				//no accept attribute function?because if function ,must support dynamic change
	            //pValue = pType=="function" ? pValue.call(this,tagKey):pValue;
                var pValueBool = !!pValue;
	            pValue = ("" + pValue).replace(/\"/g,"&quot;");		
                if(tagKey==":style"){
	                tagAttrs.styleStr = pValue;
                }
	            else if(tagKey==":class"){
	                tagAttrs.classStr = pValue;
	            }
	            else if(firstCode == ";" && pValueBool){
	                tagAttrs.styleHtml.push(tagKey.substr(1) + ":" + pValue);
	            }
	            else if(firstCode == ":"){
                    //if(tagKey==":checked")
                    //    debugger
                    if(tagKey.indexOf("-")<0 && pType == "boolean")
		                pValueBool?html.push(" " + tagKey.substr(1)):"";    
                    else
		                html.push(" " + tagKey.substr(1) + '="' + pValue + '"');      
	            }
	            else if(firstCode == "." && pValueBool){
                    //if(tagKey==".completed")
                    //    debugger
	                tagAttrs.classes.push(tagKey.substr(1));
	            }
	        }
        }

		,innerHtml:function(inner,html){
			var joinHtmlReturn = !html;
            html = html || [];
            if(typeof(inner)=="function"){
                inner = inner(this);
            }
			this.itemHtml(inner,html);
            if(joinHtmlReturn){
                return html.join("");
            }
		}

		,isArray:function(obj){
			return Object.prototype.toString.call(obj) == '[object Array]';
		}

		,itemHtml:function(item,html){
			var joinHtmlReturn = !html;
            html = html || [];
			
	        var itemType = typeof(item);
			if(item===null || itemType == "undefined"){
	        }
	        else if(this.isArray(item)){		
                for(var i=0;i<item.length;i++){
                    this.itemHtml(item[i],html);
                }
            }
	        else if(itemType=="object"){
				this._objItemHtml(item,html);
	        }
	        else{                                
	            html.push('' + item);
			}
			
            if(joinHtmlReturn){
                return html.join("");
            }
		}

		,_objItemHtml:function(item,html){
			if(item.$extend && !item.$base){
				throw new Error("getHtml but not create(maybe you must use container instead of component)");
			}
			//if item.getHtml then use it directly(usually is a instance of component)
			if(typeof(item.getHtml)!="undefined"){
				var fn = item.getHtml;
				fn = typeof(fn)=="string"?this[fn]:fn;
				var ret = fn.call(item,this,html);
				if(ret !== null && typeof(ret)!="undefined"){
					html.push('' + ret);
				}
			}
			//if bind,@inner,how to ?
			else if(item.tag || typeof(item.inner)!="undefined"){ //tag
				this.tagHtml(item,html);
			}
		}
	};
});