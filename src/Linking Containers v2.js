/*
 * Linking Containers for element or drag and drop linking
 * Author: Zak Croft
 * last updated 18.12.2011
 */


;var LinkingContainers = LinkingContainers || {};// namespace
      
      (function(){   

        var ctx = this; // this will avoid confusion with any use of 'this' in child functional context
   
        var initializing = false, fnTest = /xyz/.test(function(){
            xyz;
        }) ? /\b_super\b/ : /.*/;
        // The base Class implementation (does nothing)
        ctx.Class = function(){};

        // Create a new Class that inherits from this class
        ctx.Class.extend = function(prop) {
            var _super = this.prototype;

            // Instantiate a base class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var prototype = new this();
            initializing = false;

            // Copy the properties over onto the new prototype
            for (var name in prop) {
                // Check if we're overwriting an existing function
                prototype[name] = typeof prop[name] == "function" &&
                    typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                    (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                    prop[name];
            }

            // The dummy class constructor
            function Class() {
                // All construction is actually done in the init method
                if ( !initializing && this.initialize )
                    this.initialize.apply(this, arguments);
            }

            // Populate our constructed prototype object
            Class.prototype = prototype;

            // Enforce the constructor to be what we expect
            Class.constructor = Class;

            // And make this class extendable
            Class.extend = arguments.callee;

            return Class;
        };

       
           
      // Abstracts are set to private in the closure so they can't be instantiated

       var AbstractContainerModel = ctx.Class.extend({
		
            initialize: function(settings){
                this.containerId = settings.containerId,
                this.connectClass = settings.connectClass

            },
        
            getContainerId:function(){
                return this.containerId;
            },
                           
            getConnectorClass:function(){
                return this.connectClass;
            }
        });

        ctx.LinkingContainerModel = AbstractContainerModel.extend({

            initialize: function(settings){
                this._super(settings);
                this.linkingItemId = settings.linkingItemId,
                this.itemLinkDefId = settings.itemLinkDefId
            },

            getLinkingItemId:function(){
                return this.linkingItemId;
            },

            getItemLinkDefId:function(){
                return this.itemLinkDefId;
            }
        
        });
		            
        ctx.SearchContainerModel = AbstractContainerModel.extend({

            initialize: function(settings){
                this._super(settings);
            }
        });

       
        var EventListener = ctx.Class.extend({

            initialize : function(settings){
                this.eventCollection ={};
            },

            handleEvent:function(evt){ //Abstract
                throw new Error('Un-implemented handleEvent method in event listener')
            }

        });
        

        var EventSource = ctx.Class.extend({
            initialize : function(){
                this.listener = null;
            },

            createEvent:function(action){
                Event = function(action, source){
                    this.action = action;
                    this.source = source;
                }
                return new Event(action, this)

            },

            registerListener:function(listener){ //Abstract
                if(listener === undefined){
                    throw new Error('Listener undefined')
                }else {
                    this.listener = listener;
                }
            }
        });

        

        ctx.AjaxManager  = EventSource.extend({
            initialize: function(settings){
                this.containers = settings.containers;
                this.linkManager = settings.linkManager;
                this.ajsCount = 0;
                this.ajsArr =[];
                this.pingCount = 0;
                this.pingCountFinish = null;
            },

            setUp:function(){
                this.setAjsArr();
                if(this.ajsArr.length > 0){
                this.pingCountFinish = this.ajsArr.length;
                    this.setAjaxSavedSearches();
                    for(var i = 0, l = this.ajsArr.length; i < l; i++){
                        var a = this.ajsArr[i];
                        this.addItemLinkManagerCallbacks();  
                        this.addAjaxSearchCallback(a);   
                        this.runAjaxSearch(a);
                    }
                }else{
                    this.listener.handleEvent(this.createEvent('No Ajax To Run'));
                }
            },

            setAjsArr:function(){
                for(var key in this.containers){
                    var a = this.containers[key].getAjs();
                    if(a !== null){
                        this.ajsArr.push(a);
                    }
                }
            },
      
            addItemLinkManagerCallbacks:function(a){
                var me = this;          
                this.linkManager.resultHandler = function (xml) {  
                    me.wait(ctx.AjaxManager.indexWaitTime);
                   if(me.containers["searchContainer"].refresh !== true){
                        me.pingCountFinish = me.pingCountFinish-1;
                    }
                    me.runAjaxSearch(me.containers["linkContainer"].getAjs());
                    if(me.containers["searchContainer"].refresh === true){
                        me.runAjaxSearch(me.containers["searchContainer"].getAjs());
                    }
                }    
            },
            
            addAjaxSearchCallback:function(ajs){
                var me = this;
                ajs.callBackFunctions.add(function(){
                    me.ajsCompletedPing();
                });
            },
            
            setAjaxSavedSearches:function(){
                if(this.containers["searchContainer"].getAjs() !== null && 
                    this.containers["searchContainer"].enforceSet === true){
                    this.removeLinkedItemsFromSearch(
                    this.containers["searchContainer"].getAjs());
                }
            },

            removeLinkedItemsFromSearch:function(ajs){
                var linkId = this.containers["linkContainer"].getModel().getItemLinkDefId(); 
                var searchStr = ajs.searchAdapter.savedSearch;
                searchStr += " AND ITEM_LINK_DEF"+linkId+":NONE";
                ajs.setSavedSearch(searchStr);
            },
            
            runAjaxSearch:function(ajs){               
                ajs.search();
            },

            ajsCompletedPing:function(){
                this.pingCount++
                if(this.pingCount == this.pingCountFinish){
                    this.pingCount = 0;
                    this.pingCountFinish = this.ajsArr.length;
                    this.listener.handleEvent(this.createEvent('Ajax Completed'));
                }
            },
            
            wait : function (millis) {
                var date = new Date();
                var curDate = null;		
                do { curDate = new Date(); } 
                while(curDate-date < millis);
		
            },
            
            setIndexWaitTime:function(ms){
                this.indexWaitTime = ms;
            }
        });
        
        //Statics
        ctx.AjaxManager.indexWaitTime = 100;
                
        ctx.ItemLinkingController = EventListener.extend({

            initialize: function(){
                this.containers= {};
                this.ajaxManager = {};
                this.itemLinkManager = {};
            },

            run:function(){
                // pass though settings?
                this.itemLinkManager = new ItemLinkManager();
                this.ajaxManager = new ctx.AjaxManager({
                    containers:this.containers,
                    linkManager:this.itemLinkManager
                })
                this.ajaxManager.registerListener(this);
                this.ajaxManager.setUp();
            },
            

            registerContainer:function(container){
                container.registerListener(this);
                if(container instanceof ctx.ItemLinkingContainer){
                    this.containers["linkContainer"] = container;
                }
                if(container instanceof ctx.SearchContainer){
                    this.containers["searchContainer"] = container;
                }
            },

            initContainers:function(){
                for(var key in this.containers){
                    this.containers[key].setInteractiveElement();
                    this.containers[key].setItemIds();
                    this.containers[key].makeInteractive();
                    this.containers[key].runCallbacks();
                }
            },
                       
            linkItem:function(item){
                var itemIdArr = this.containers["linkContainer"].getItemId(item).split();
                var linkingItemId = this.containers["linkContainer"].getLinkingItemId();
                var linkDefId = this.containers["linkContainer"].getItemLinkDefId();
                //itemId, linkDefId, itemsToLink, deactivateNewLinks, addToExistingLinks, activateCurrentLinks
                this.itemLinkManager.addItemLink( linkingItemId, linkDefId, itemIdArr, false, true, true);        
            },
            
            unLinkItem:function(item){
                var linkId = this.containers["linkContainer"].getLinkId(item);
                this.itemLinkManager.removeLinkByItemLinkId(linkId);
            },

            linkContainerItems:function(){
                var linkingItemId = this.containers["linkContainer"].getLinkingItemId();
                var linkDefId = this.containers["linkContainer"].getItemLinkDefId();
                var itemsToLink = this.containers["linkContainer"].getItemIds();
                //hotfix to tak into consideration that the an empty array wont do anything
                /// so last item will never be remove.
                //by using[""] if array is empty solves th problem at the moment.
                if(itemsToLink.length === 0){
                    itemsToLink =[""];
                }
                           
                //itemId, linkDefId, itemsToLink, deactivateNewLinks, addToExistingLinks, activateCurrentLinks
                this.itemLinkManager.addItemLink( linkingItemId, linkDefId, itemsToLink, false, false, true);
            },

            handleEvent:function(evt, payload){
                
                var action = evt.action;
                var source = evt.source;
                switch(action){
                    case'Ajax Completed':
                        this.initContainers();                        
                        break;
                    case'No Ajax To Run':
                        this.initContainers();
                        break;
                    case'Link Items':
                        this.linkContainerItems();
                        break;
                    case'Link Item':
                        this.linkItem(payload);
                        break;
                    case'Remove Item':
                        this.unLinkItem(payload);
                        break;
                    case'Get Container Items':
                        return this.containers[payload].getItemIds();
                        break;
      
                }     
            }
        });


        var AbstractContainer = EventSource.extend({

            initialize: function(settings){
                this._super(settings);
                this.model = null;
                this.ajs = null;
                this.interactions = settings.interactions,
                this.interactiveElement = null;
                this.callBackFunctions =[];
                
            },

            registerModel:function(model){               
                if( model instanceof AbstractContainerModel ) {
                    if( model.containerId !== "" && this.model === null){
                        this.model = model;
                    } else {
                        throw new Error("Id is invalid or duplicated");
                    }
                } else {
                    throw new Error("model has to extend AbstractContainerModel");
				
                }
            },

            bindAjaxSearch:function(ajax){
                if(ajax !== undefined){
                    this.ajs = ajax;
                }else{
                    throw new Error("Unrecognised ajax object");
                }
            },

            makeInteractive:function(){
                throw new Error('Un-implemented makeInteractive method in container with id "'+this.getModelId()+'"');
            },

            getAjs:function(){
                return this.ajs;
            },

            getInteractiveElement:function(){
                return this.interactiveElement;
            },

            setInteractiveElement:function(){
                this.interactiveElement = jQuery('#'+ this.getModelId());
            },
            
            getModel:function(){
                return this.model;
            },
            
            getModelId:function(){
                return this.model.getContainerId();
            },

            addCallBackFunction:function(fn){
              this.callBackFunctions.push(fn);

            },
          
            runCallbacks:function(){
                for(var x=0, l; l= this.callBackFunctions.length; x++){
                    this.callBackFunctions[x].apply(this)
                }
                this.callBackFunctions = [];
            }

        });
        

        var AbstractItemContainer = AbstractContainer.extend({

            initialize: function(settings){
                this._super(settings);
                this.elementText = null;
                this.firstRun = true;
                this.items =[];
            },


            setItemIds: function(){
                var me = this;
                this.items =[];
                var items = jQuery('#'+this.getModelId()+' li');
                items.each(function(i){
                    me.items.push(me.getItemId(items[i]));
                })
                return this;
            },
                        
            getItemIds:function(containerId){
                this.setItemIds(); // make sure they are up to date;
                if(containerId !== undefined){
                    return this.listener.handleEvent(this.createEvent('Get Container Items'), containerId);
                }else{
                    return this.items;
                }
            },

            getItemId: function(item){
                return jQuery(item).attr("class").match(/itemId-\d*/)[0].replace('itemId-','');
            },

            getItemById:function(id){
                return jQuery('#'+this.getModelId()+' li.itemId-'+id);
            },
            
            getLinkId:function(item){
                return jQuery(item).attr('class').match(/linkId-\d*/)[0].replace('linkId-','');
            },
        
            getLinkingItemId:function(){
                return this.model.getLinkingItemId();
            },

            getItemLinkDefId:function(){
                return this.model.getItemLinkDefId();
            },

            // is this used anymore?
            removeItemFromView:function(item){
                jQuery(item).remove();
            },

            addItem:function(item){
                this.listener.handleEvent(this.createEvent('Link Item'), item);
            },

            removeItem:function(item){
                //itemId, linkDefId, itemsToLink, deactivateNewLinks, addToExistingLinks, activateCurrentLinks
                this.listener.handleEvent(this.createEvent('Remove Item'), item);
            },

            // should be protected - subclass addItemRemoveElement
            attachElementHandlers:function(clazz, action){       
                var me = this;
                jQuery('#'+ this.getModelId()+' li .'+clazz).each(function(){
                    var item = jQuery(this).closest('#'+ me.model.containerId+' li');
                    jQuery(this).unbind("click").click(function(){
                        me[action+'Item'](item);
                    })
                })
            },

            setElementText:function(onText, offText){
                this.elementText = {
                    "onText": onText,
                    "offText":offText
                }
            },
            
            initAnchors:function(clazz){
                var me = this;
                jQuery('#'+ this.getModelId()+' li .'+clazz).each(function(){                  
                    jQuery(this).text(me.elementText["onText"]).removeClass('disabled');
                    jQuery(this).closest('#'+ me.getModelId()+' li').removeClass('linkedItem');

                }) 
            }                
        });
        

        ctx.ItemLinkingContainer = AbstractItemContainer.extend({

            initialize : function(settings){
                this._super(settings);
            },

            makeInteractive:function(){
           
                if(this.interactions['element'] !== undefined){     
                    this.attachElementHandlers(this.interactions['element'], 'remove');
                    this.initAnchors(this.interactions['element']);
                }else if(this.interactions['sortable']){
                    var me = this;
                    this.interactiveElement.sortable({
                        connectWith: "."+this.model.getConnectorClass(), //class
                        update: function(){
                            me.listener.handleEvent(me.createEvent('Link Items'))
                        }
                    }).disableSelection();
                }
            }
        });


        ctx.SearchContainer = AbstractItemContainer.extend({
            initialize : function(settings){
                this._super(settings);
                this.enforceSet = settings.enforceSet===false?false:true;
                this.refresh = settings.refresh===false?false:true;
            },

            makeInteractive:function(){           
                if(this.interactions['element'] !== undefined){   
                    this.enforceSet = false;
                    this.attachElementHandlers(this.interactions['element'], 'add');
                    this.initAnchors(this.interactions['element']);
                    this.disableLinks(this.getItemIds("linkContainer"));
                }else if(this.interactions['sortable'] ){
                    var me = this;
                    this.interactiveElement.sortable({
                        connectWith: "."+this.model.getConnectorClass() //class
                    }).disableSelection();
                }
            },
           
           
            disableLinks:function(against){
                for(var i = 0, l = against.length; i < l; i++){
                    this.setAnchorText(this.getItemById(against[i]));
                }
            },

            setAnchorText:function(item){
                var onText = this.elementText["onText"];
                var offText = this.elementText["offText"];
                var a = jQuery('#'+ this.getModelId()+' li.itemId-'+this.getItemId(item)+ ' .'+this.interactions['element'])
                if(onText !== undefined && offText !== undefined){
                    var me = this;
                    var at = a.text();
                    if(at === onText){
                        a.text(offText).addClass('disabled').unbind('click');
                        jQuery(item).addClass('linkedItem');
                        // callback here
                    }
                }
                
            }
        });
    }).apply(LinkingContainers)

