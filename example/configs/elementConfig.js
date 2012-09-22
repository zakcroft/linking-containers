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
        linkingAjs.setSavedSearch('active:true')



        var linkingContainer = new ctx.ItemLinkingContainer({
            interactions: {
                element:'remove' //class
            }
        })

        var searchContainer = new ctx.SearchContainer({
            interactions: {
                element:'add' //class
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
        
        searchContainer.setElementText('Add', 'Linked'); 
        linkingContainer.setElementText('Remove');   

        var controller =  new ctx.ItemLinkingController();
        controller.registerContainer(linkingContainer);
        controller.registerContainer(searchContainer);
        controller.run();
    })

