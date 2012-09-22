
jQuery(document).ready(function(){

        var ctx = LinkingContainers;

        var linkingAjs = new VYRE.AjaxSearch({
            searchType: 'content',
            gatewayId: 1,
            pageId: $page_id,
            portletId: $portlet_id,
            xslId: '62',
            storeId: "2",
            displayItemId: null,
            realmId: 'initial',
            contextPath: '$context_path',
            globalXmlCfgId :'121'

        })

        linkingAjs.setContainerNamespace('ajaxLinkingResults');
        linkingAjs.setSavedSearch('active:true');

       var searchAjs = new VYRE.AjaxSearch({
            searchType: 'content',
            gatewayId: 31,
            pageId: $page_id,
            portletId: $portlet_id,
            xslId: '61',
            storeId: "1",
            displayItemId: null,
            realmId: 'initial',
            contextPath: '$context_path',
            globalXmlCfgId :'31'

        })

        //ctx.AjaxManager.indexWaitTime = 200;

        searchAjs.setContainerNamespace('ajaxSearchResults');
        searchAjs.setSavedSearch('active:true');



        var linkingContainer = new ctx.ItemLinkingContainer({
            interactions: {
                sortable:true 
            }
        })

        var searchContainer = new ctx.SearchContainer({
            interactions: {
               sortable:true 
            }
        })


       linkingContainer.registerModel(new ctx.LinkingContainerModel({
        containerId:'linkingContainer',
        connectClass:'connected',
        linkingItemId:$current_item_id,
        itemLinkDefId: '1'
         }));



       searchContainer.registerModel(new ctx.SearchContainerModel({
          containerId:'searchContainer',
          connectClass:'connected'
       }));


        linkingContainer.bindAjaxSearch(linkingAjs); 
        searchContainer.bindAjaxSearch(searchAjs); 
  
        var controller =  new ctx.ItemLinkingController();
        controller.registerContainer(linkingContainer);
        controller.registerContainer(searchContainer);
        controller.run();
    })


