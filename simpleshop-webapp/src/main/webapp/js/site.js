/*
 * This file contains script that backs the UI layer.
 * Above is an example of unnecessary comment.
 */
(function () {

    /**
     * All references to UI layer element id or url are defined in this object.
     */
    var site = new (function(){
        var jsonPath = "/quickshop/json/"; //the root path for json related operations, e.g. save object, refresh object or search.
        var viewPath = "ng/quickshop/"; //the root path of all views

        /**
         * Construct the url to get a single model in json format.
         * @param modelName will be converted to url model name, e.g. 'customer_group'.
         * @param modelId Pass false in modelId to get the json of a new model, which contains all defaults.
         * @returns {string}
         */
        this.modelJsonUrl = function(modelName, modelId){
            var url = jsonPath + zcl.pascalNameToUrlName(modelName) + "/";
            url  += modelId || "new";
            return url;
        };

        /**
         * Construct the search url.for a model type.
         * When accessed with 'GET', this url returns the search parameters object with all default values.
         * When accessed with a 'POST', you post the populated search parameters object and get a list of models of the specified type.
         * @param modelName model type in url naming.
         * @returns {string}
         */
        this.searchJsonUrl = function(modelName) {
            return jsonPath + zcl.pascalNameToUrlName(modelName) + "/search";
        };

        /**
         * Construct a url for a model name what you can use to save a model with a 'POST'.
         * @param modelName
         * @returns {string}
         */
        this.saveUrl = function(modelName) {
            return jsonPath + zcl.pascalNameToUrlName(modelName) + "/save";
        };

        /**
         * Get a list which is cached in the application (via LookupService).
         * @param listName
         * @returns {string}
         */
        this.listJsonUrl = function(listName){
            return jsonPath + zcl.pascalNameToUrlName(listName);
        };

        /**
         * Construct the url to access a view.
         * @param viewName full view name as in the view jsp file.
         * @param viewId meaning of this depends on view name:
         * details -> modelId
         * edit -> modelId
         * list -> incremental id
         */
        this.viewUrl = function(viewName, instanceId, params){
            var viewUrl = viewPath + viewName + ".jsp";
            var viewId = viewName;
            if(instanceId)
                viewId += "-" + instanceId;

            viewUrl += "?viewId=" + viewId;
            if(params) {
                viewUrl +=  "&" + $.param(params);
            }
            return viewUrl;
        };

        //page elements
        this. noSearchViewElementId = "noSearchViewMessage"; //id of the message element which is shown where there is search view in the search view section.
        this.noViewElementId = "noResultMessage"; //id of the message element which is shown where there is no view in the view section. The main section is divided into search view section and view section.
        this.headerElementId = "pageHeader"; //header element id, the header is fix positioned.
    })();

    /**
     * A map from view hash to viewId and view elements.
     * strHash -> {viewId:1234,viewElements:[...]}.
     * @type {{}}
     */
    var viewMap = {};

    //region util functions - these are specific to the quickshop ui layer. Generic ones should be added to zcl.js.

    /**
     * Scroll to an element.
     * @param id
     */
    var scrollTo = function (id) {
        var elem = document.getElementById(id);
        if (!elem)
            return;

        window.location.href = "#" + id;
        var headerHeight = $("#" + site.headerElementId).height(); //header is fix positioned
        window.scrollBy(0, -headerHeight);
    };

    /**
     * Set if an element is visible.
     * There are a few different different techniques used to set element visibility in quickshop, this method consider them all.
     * @param id
     * @param show true to show.
     * @returns {boolean} true if the operation is successful.
     */
    var display = function (id, show) {
        var elem = document.getElementById(id);
        if (!elem)
            return false;

        elem = $(elem);
        if (!elem.parent().hasClass("hide-children")) {
            if (show)
                elem.show();
            else
                elem.hide();
            return false;
        }

        var classes = elem.attr("class");
        if (show) {
            if (classes.indexOf("display") < 0) {
                elem.addClass("display");
            }
        } else {
            if (classes.indexOf("display") >= 0) {
                elem.removeClass("display");
            }
        }

        return false;
    };

    /**
     * A utility function to simplify functional programming.
     * @param rejectReason pass null to indicate success.
     * @returns {*} returns a promise that has already been resolved or rejected.
     */
    var createPromise = function (rejectReason) {
        var deferred = $.Deferred();
        if (rejectReason)
            deferred.reject(rejectReason);
        else
            deferred.resolve();
        return deferred.promise();
    };

    /**
     * Apply a function, if already in digest cycle just call it (it is already being applied).
     * todo should eventually eliminate all calls to this function.
     * @param scope
     * @param func
     */
    var safeApply = function (scope, func) {
        if (scope.$root.$$phase != '$apply' && scope.$root.$$phase != '$digest') {
            scope.$apply(func);
        } else {
            func();
        }
    };

    /**
     * Report an error.This is usually called on the endOp promise.
     * @param error error object.
     */
    var reportError = function (error) {
        if (error)
            alert(error); //todo use js message prompt instead of alert
    };

    /**
     * Check if a viewType is a subtype of parentViewType.
     * @param viewType string.
     * @param parentViewType string.
     * @returns {boolean}
     */
    var isSubtypeOf = function(viewType, parentViewType){
        if(viewType == parentViewType)
            return true;

        return viewType.indexOf(parentViewType + "_") == 0;
    }

    var findViewDetails = function (viewId) {
        for (var key in viewMap) {
            if (viewMap[key].viewId == viewId) {
                return viewMap[key];
            }
        }

        return null;
    };

    var getBodyScope = function(){
        return $("#" + site.noViewElementId).scope();
    };

    //endregion

    var quickshopApp = angular.module("quickshopApp", [], null);

    //region filters

    quickshopApp.filter("status", function () {
        return function (input) {
            return input == 'A' ? "Active" : "Inactive";
        };
    });

    quickshopApp.filter('yn', function () {
        return function (input) {
            return input == 'Y' ? '\u2713' : '\u2718';
        };
    });

    quickshopApp.filter('phone', function () {
        return function (input) {
            return input;
        };
    });

    quickshopApp.filter('url', function () {
        return function (input) {
            if(input){
                var index = input.toString().indexOf("#");
                if(index >= 0){
                    return input.substring(index + 1, input.length - 1);
                }
            }
            return input;
        };
    });

    quickshopApp.filter('url_label', function () {
        return function (input) {
            if(input){
                var index = input.toString().indexOf("#");
                if(index >0){
                    return input.substring(0, index);
                }
            }
            return input;
        };
    });

    quickshopApp.filter('yesno', function () {
        return function (input) {
            return input == 'Y' ? 'Yes' : 'No';
        };
    });

    quickshopApp.filter('na', function () {
        return function (input) {
            return input != null ? input : 'N/A';
        };
    });

    quickshopApp.filter('percent', function () {
        return function (input) {
            return input != null ? input + "%" : 'N/A';
        };
    });

    quickshopApp.filter('pascal', function () {
        return function (input) {
            var values = input.replace(/-/g, ' ').split();
            for (var i = 0; i < values.length; i++) {
                values[i] = zcl.firstCharUpper(values[i]);
                values[i] = values[i].toString().replace(/_/g, ' ');
            }
            return values.join(' ');
        };
    });

    //endregion

    //region service

    quickshopApp.factory("quickshopService", ["$compile", "$rootScope", function ($compile, $rootScope) {

        /**
         * All operations fired on the client side must execute beginOp and endOp in pair with the same token.
         * This will trigger a digest cycle at root level.
         * @param token used to identity an operation.
         */
        var beginOp = function (token) {
            var bodyScope = getBodyScope();
            if ($.inArray(token, bodyScope.operationLocks) >= 0)
                return createPromise("Operation is in progress, please wait.");

            safeApply(bodyScope, function () {
                bodyScope.operationLocks.push(token); //trigger ui change, e.g. spinning wheel.
            });
            return createPromise(null);
        };

        /**
         * End an operation by removing it from the operation lock list.
         * This will trigger a digest cycle at root level.
         * @param token the operation to end.
         */
        var endOp = function (token) {
            var bodyScope = getBodyScope();
            var index = $.inArray(token, bodyScope.operationLocks);
            if (index < 0)
                return createPromise("Operation " + token + " is not in progress.");

            safeApply(bodyScope, function () {
                bodyScope.operationLocks.splice(index, 1);
            });
            return createPromise(null);
        };

        var sequenceNumbers = {};
        /**
         * Generate the unique id for a view.
         * @param viewName
         * @param instanceId
         * @returns {string}
         */
        var generateViewId = function (viewName, instanceId, returnInstanceId) {
            if(instanceId)
                return returnInstanceId ? instanceId : viewName + "-" + instanceId;

            if(viewName.indexOf("-search") > 0)
                return returnInstanceId ? null : viewName;

            //those are not identified by instanceId use an instance sequence number
            if (!sequenceNumbers[viewName]) {
                sequenceNumbers[viewName] = 0;
            }
            sequenceNumbers[viewName]++;

            return returnInstanceId ? sequenceNumbers[viewName] : viewName + "-" + sequenceNumbers[viewName];
        };

        var defaultGetViewOption = {
            removeExisting : false,
            viewKeyPrefix : "",
            instanceIdInViewKey : true,
            viewTypeInViewKey : false,
            modelInViewKey : true
        };

        /**
         * Get a view with its model (in JSON) embedded from the server.
         * @param modelName model name in pascal casing.
         * @param viewType type of the view; e.g. search, create, details, update, list.
         * @param instanceId an object that uniquely identifies view instance for the given viewName (which is modelName-viewType).
         * @param params query string parameters as properties of a plain object.
         * @param model the content to post to the server in order to generate the view and its data. If this is not null a post instead of a get will occur.
         * @param getViewOptions - removeExisting whether to remove existing view with the same id.
         * @returns {*} the promise of this operation.
         */
        var getView = function (modelName, viewType, instanceId, params, model, getViewOptions) {

            getViewOptions = $.extend($.extend({}, defaultGetViewOption), getViewOptions);
            var viewName = zcl.pascalNameToUrlName(modelName) + "-" + viewType;

            //calculate viewKey; two views have the same key if they display the same content and therefore one has to close for the other to open.
            var viewKeyObject = {
                viewKeyPrefix : getViewOptions.viewKeyPrefix,
                modelName: modelName
            };
            if(getViewOptions.modelInViewKey && model){
                viewKeyObject.model = model;
            }
            if(getViewOptions.instanceIdInViewKey && instanceId){
                viewKeyObject.instanceId = instanceId = instanceId || generateViewId(viewName, instanceId, true); //require instance id to be generated here
            }
            if(getViewOptions.viewTypeInViewKey){
                viewKeyObject.viewType = viewType;
            }
            var viewKey = JSON.stringify(viewKeyObject);

            var existingViewDetails = viewMap[viewKey];
            var viewId = null;
            if(existingViewDetails){
                viewId = existingViewDetails.viewId;
                if(!getViewOptions.removeExisting){

                    display(viewId, true);
                    scrollTo(viewId);

                    if(existingViewDetails.viewType != viewType){
                        return createPromise(zcl.formatObject("The content of view '{0}' is already being displayed.", [viewType]));
                    }
                    return createPromise(null);
                }
            }

            if(!viewId){
                viewId = generateViewId(viewName, instanceId);
            }
            var viewUrl = site.viewUrl(viewName, instanceId, params);

            /**
             * Create the view from the view html returned from the server.
             * @param viewHtml
             * @returns {*}
             */
            var createView = function (viewHtml) {

                var elements = $.parseHTML(viewHtml, null, true);

                //separate view and model
                var json = null;
                for (var i = elements.length - 1; i >= 0; i--) {
                    if (elements[i] && elements[i].tagName == "SCRIPT") {
                        json = elements[i].innerHTML;
                        elements.splice(i, 1);//remove last script tag
                        break;
                    }
                }
                json = $.trim(json);
                if(!json){
                    return createPromise("Could not extract the model from the view html.");
                }

                //workout next sibling
                var nextElement = null;
                if(existingViewDetails){ //replacing existing view
                    nextElement = $(existingViewDetails.viewElements).last().next();
                } else {
                    if (viewName.contains("-search")) {
                        nextElement = $("#" + site.noSearchViewElementId);
                    } else {
                        nextElement = $("#" + site.noViewElementId);
                    }
                }
                if(!nextElement){
                    return createPromise("Could not determine the insert position for the view being created.");
                }

                //insert element
                var newModel = JSON.parse(json);
                var newViewDetails = {viewId: viewId, viewName: viewName, modelName: modelName, viewType: viewType, params: params, model: newModel, viewElements: elements, getViewOptions : getViewOptions};
                if (existingViewDetails) {
                    $(existingViewDetails.viewElements).remove();
                }
                viewMap[viewKey] = newViewDetails;

                var parentScope = $(nextElement).parent().scope();
                try{
                    safeApply(parentScope, function () {
                        try {
                            nextElement.before(elements);
                            $compile(elements)(parentScope);
                        }
                        catch (ex) {
                            delete viewMap[viewKey];
                            throw ex;
                        }
                    });
                } catch(ex){
                    return createPromise("View compilation failed:" + ex);
                }

                //jquery initialization for the view
                $(elements).find("ul.nav.nav-tabs").makeTab();
                $(elements).find(".date-picker").each(function (index, element) {//make datepickers
                    var input = $(element);
                    var dateFormat = "yy-mm-dd";//todo need to work out a solution - problem is datepicker date format and angularjs date format is not consistent. input.data("spg-date");
                    input.datepicker({dateFormat: dateFormat});
                });
                scrollTo(viewId);
                return createPromise(null);
            };

            var operationKey = "get-" + viewId;
            var operation = function () {
                var ajaxPromise;
                if (model) { //need to post
                    ajaxPromise = $.ajax(
                        viewUrl,
                        {
                            type: "POST",
                            data: JSON.stringify(model),
                            contentType: "application/json",
                            dataType: "html"
                        }
                    );
                } else {
                    ajaxPromise = $.get(viewUrl);
                }

                return ajaxPromise.then(
                    createView,
                    function (jqXHR, textStatus) {
                        return createPromise("Failed to retrieve view " + viewName + ": " + textStatus);
                    }
                ).always(function () {
                    return endOp(operationKey);
                });
            };

            return beginOp(operationKey).then(operation);
        };

        var save = function (viewId) {

            var viewDetails = findViewDetails(viewId);
            var url = site.saveUrl(viewDetails.modelName);
            var scope = angular.element("#" + viewId).scope();
            var model = scope["model"];
            var data = JSON.stringify(model);
            var operationKey = "save-" + viewId;

            var saveModel = function () {

                var savePromise = $.ajax(url,
                    {
                        type: "POST",
                        data: data,
                        contentType: "application/json",
                        dataType: "json"
                    });

                var saveSuccess = function (response) {
                    if (response["status"] == "success") {

                        if (response["description"]) {
                            scope.$apply(function () {
                                scope["model"] = response["domainObject"];
                                viewDetails.model = response["domainObject"];
                            });
                        }
                        return cancel(viewId);
                    }
                    return createPromise(response["description"]);
                };

                return savePromise
                    .then(saveSuccess)
                    .always(function () {
                        endOp(operationKey);
                    });
            };

            return beginOp(operationKey).then(saveModel);

        };

        /**
         * Close create view or
         * Close update view and open details view.
         * @param viewId
         * @returns {*}
         */
        var cancel = function (viewId) { //always from create or update back to details
            var scope = angular.element("#" + viewId).scope();

            var viewDetails = findViewDetails(viewId);
            var modelName = viewDetails.modelName;
            var viewName = viewDetails.viewName;
            if (isSubtypeOf(viewName, "create"))
                return close(viewId);

            return getView(modelName, "details" + viewDetails.viewType.substr(6), viewDetails.instanceId, viewDetails.params, null, viewDetails.getViewOptions);
        };


        var refresh = function (elementId) {
            var element = $("#" + elementId);
            if (element.size() == 0)
                return createPromise(null);

            //todo
            return createPromise("Not implemented");
        };

        /**
         * Close a view.
        */
        var close = function (viewId) {
            var allViews = $(".view.display");
            var viewCount = allViews.size();
            var index = 0;
            for(; index  <viewCount; index++){
                if(allViews.get(index).id == viewId)
                    break;
            }
            if(index == viewCount)
                throw "Cannot find view " + viewId;

            var element = $(allViews.get(index));
            var gotoView = null;
            if(index == viewCount - 1 && viewCount > 1){
                gotoView = $(allViews.get(index - 1));
            }

            safeApply(getBodyScope(), function () {
                var viewDetails = findViewDetails(viewId);
                if (viewDetails)
                    delete viewMap[viewDetails.key];
            });
            element.remove();
            if(gotoView){
                scrollTo(gotoView.attr("id"));
            }
            return createPromise(null);
        };

        var beginLinkRequest = function (elementId) {
            var fieldElement = $("#" + elementId);
            if (fieldElement.size() == 0)
                return createPromise(null);

            var requests = $("#linkRequests");
            if (requests.children("*").size() >= 3) {
                return createPromise("Cannot create more link request.");
            }

            if ($("#link-" + elementId).size() > 0)
                return createPromise(null);

            var scope = getBodyScope();

            scope.$apply(function () {
                scope.linkRequests.splice(0, 0, {sourceFieldId: elementId, modelName: fieldElement.data("model-name")});
            });

            fieldElement.closest(".panel").on("$destroy", function () {
                cancelLinkRequest(elementId);
            });

            return createPromise(null);
        };

        var cancelLinkRequest = function (elementId) {
            var scope = getBodyScope();

            scope.$apply(function () {
                for (var i = 0; i < scope.linkRequests.length; i++) {
                    if (scope.linkRequests[i].sourceFieldId == elementId) {
                        scope.linkRequests.splice(i, 1);
                        break;
                    }
                }
            });

        };

        var endLinkRequest = function (ownerElement, elementId) {

            var descScope = angular.element("#" + elementId).scope();
            if (descScope) {
                descScope.$apply(function () {
                    var id = $(ownerElement).data("id");
                    var desc = $(ownerElement).data("desc");
                    var idProperty = $("#" + elementId).data("ng-model");
                    var descExpr = $("#" + elementId + "-desc").data("ng-bind");
                    zcl.setProp(descScope, idProperty, id);
                    zcl.setProp(descScope, descExpr, desc);
                });
                descScope.$apply(function () {
                });
            }
            cancelLinkRequest(elementId);
        };

        return {
            getView: getView,
            save: save,
            cancel: cancel,
            refresh: refresh,
            close: close,
            beginLinkRequest: beginLinkRequest,
            endLinkRequest: endLinkRequest,
            cancelLinkRequest: cancelLinkRequest,
            sequenceNumbers: {}
        };

    }]);

    //endregion

    //region directives

    /**
     * This directive enables an element to open a search view for a model when clicked.
     */
    quickshopApp.directive("spgSearch", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function ($event) {
                    var modelName = attrs["spgSearch"];
                    quickshopService.getView(modelName, "search", null, null, null, {viewTypeInViewKey:true})
                        .fail(function (error) {
                            reportError(error);
                        });
                    $event.preventDefault();
                });
            }
        };
    }]);

    /**
     * This directive enables an element to open a create view for a model when clicked.
     */
    quickshopApp.directive("spgCreate", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function ($event) {
                    var modelName = attrs["spgCreate"];
                    quickshopService.getView(modelName, "create", null, null, null, {viewTypeInViewKey : true})
                        .fail(function (error) {
                            reportError(error);
                        });
                    $event.preventDefault();
                });
            }
        };
    }]);

    /**
     * Annotate an element so that when clicked the update view of a model is opened and its details view closed (if one is open)..
     */
    quickshopApp.directive("spgUpdate", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function ($event) {
                    var args = JSON.parse(attrs["spgUpdate"]);
                    var modelId = args["modelId"];
                    quickshopService.getView(args["modelName"], "update", modelId, {modelId: args["modelId"]}, null, {removeExisting : true})
                        .fail(function (error) {
                            reportError(error);
                        });
                    //$event.preventDefault();
                });
            }
        };
    }]);

    /**
     * Annotate an element so that when clicked the details view of a model is opened.
     */
    quickshopApp.directive("spgDetails", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function ($event) {
                    var args = JSON.parse(attrs["spgDetails"]);
                    var modelName = args["modelName"];
                    var modelId = args["modelId"];

                    if(typeof modelId == "string"){
                        if(modelId.substring(0,1) == "#"){
                            modelId = $(modelId).val();
                            modelId = parseInt(modelId);
                            if(isNaN(modelId)){
                                modelId = zcl.subStrBeforeFirst($(args["modelId"]).val(), '-', true);
                            }
                        }
                    }
                    if(!modelId)
                        return;

                    quickshopService.getView(modelName, "details", modelId, {modelId: modelId}, null, {removeExisting : true})
                        .fail(function (error) {
                            reportError(error);
                        });
                    //$event.preventDefault();
                });
            }
        };
    }]);

    /**
     * Annotate an element so that when clicked the details view of a model is opened.
     */
    quickshopApp.directive("spgList", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function ($event) {
                    var args = JSON.parse(attrs["spgList"]);
                    var modelName = args["modelName"];

                    quickshopService.getView(modelName, "list", null, null, args["criteria"], {instanceIdInViewKey : true})
                        .fail(function (error) {
                            reportError(error);
                        });
                });
            }
        };
    }]);

    quickshopApp.directive("spgSave", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function ($event) {

                    if ($(element).closest("form").hasClass("ng-invalid")) {
                        alert("Please correct error(s) in the form first.");
                        return false;
                    }

                    var viewId = attrs["spgSave"];
                    quickshopService.save(viewId)
                        .fail(function (error) {
                            reportError(error);
                        });

                    return false;
                });
            }
        };
    }]);

    /**
     * Can refresh update., details and list
     */
    quickshopApp.directive("spgRefresh", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                var viewId = attrs["spgRefresh"];
                if (!viewId)
                    return;

                $(element).click(function () {

                    quickshopService.refresh(viewId)
                        .fail(function (error) {
                            reportError(error);
                        });
                    return false;

                });
            }
        };
    }]);

    quickshopApp.directive("spgCancel", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                $(element).click(function () {

                    if ($(element).closest("form").hasClass("ng-dirty")) {
                        if (!confirm("Do you want to discard un-saved changes in the form?"))
                            return false;
                    }

                    quickshopService.cancel(attrs["spgCancel"])
                        .fail(function (error) {
                            reportError(error);
                        });

                    return false;
                });
            }
        };
    }]);

    quickshopApp.directive("spgClose", ["quickshopService", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var targetId = attrs["spgClose"];
                if (!targetId)
                    return;

                $(element).click(function () {
                    var nextElement = $("#" + targetId).next();
                    quickshopService.close(targetId)
                        .fail(function (error) {
                            reportError(error);
                        });
                    scrollTo(nextElement.attr("id"));
                    return false;
                });
            }
        };
    }]);

    //data-spg-show="show_element_id"
    quickshopApp.directive("spgShow", function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var targetId = attrs["spgShow"];
                $(element).click(function () {
                    display(targetId, true);
                });
            }
        };
    });

    quickshopApp.directive("spgDate", ["$filter", function ($filter) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                $(element).addClass("date-picker");
                var format = attrs["spgDate"];

                var dateParser = function (value) {
                    var result = Date.parse(value);
                    if(isNaN(result))
                        return value;
                    return result;
                };

                var dateFormatter = function(value){
                    var result = $filter('date')(value,format);
                    if(result)
                        return result;
                    return value;
                };

                ngModel.$parsers.push(dateParser);
                ngModel.$formatters.push(dateFormatter);
            }
        };
    }]);

    //data-spg-hide="hide_element_id"
    quickshopApp.directive("spgHide", function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var targetId = attrs["spgHide"];

                $(element).click(function () {
                    var nextElement = $("#" + targetId).next();
                    scrollTo(nextElement.attr("id"));
                    return display(targetId, false);
                });

            }
        };
    });

    //data-spg-toTop
    quickshopApp.directive("spgToTop", function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element).click(function () {
                    scrollTo(site.headerElementId);
                    return false;
                });
            }
        };
    });

    //data-spg-new-scope
    quickshopApp.directive("spgNewScope", function () {
        return {
            restrict: 'A',
            scope: true
        };
    });

    //data-toggle
    quickshopApp.directive("spgToggle", function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var variable = attrs["spgToggle"];
                if (!variable)
                    return;

                $(element).click(function () {
                    scope.$apply(function () {
                        scope[variable] = !scope[variable];
                    });
                    return false;
                });
            }
        };
    });

    //todo review spgCombo
    quickshopApp.directive("spgCombo", function (quickshopService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: true,
            link: function (scope, element, attrs, ngModel) {

                scope.ngModel = ngModel;
                var config = {delay: 500, validationErrorKey: "comboError"};
                var configOverride = JSON.parse(attrs["spgCombo"]);
                $.extend(config, configOverride);
                var input = $(element).find("input");
                var ol = $(element).find("ol");

                var getList = function () {
                    var text = input.val();
                    if (!text) {//clear list
                        scope.comboList = [];
                        scope.showList = false;
                        scope.$digest();
                        return;
                    }

                    scope.showList = true;
                    scope.loadingList = true;
                    scope.comboList = [];
                    scope.$digest();

                    var promise = input.data("pending-list-request");
                    if (promise) {
                        promise.abort();
                    }
                    var model = {listName: config["targetModelName"], keywords: text};
                    var data = JSON.stringify(model);
                    promise = $.ajax(site.jsonPath + "list", {
                        type: "POST",
                        data: data,
                        contentType: "application/json",
                        dataType: "json"
                    });
                    input.data("pending-list-request", promise);

                    promise.done(function (data) {
                        if (data) {
                            scope.comboList = data;
                        } else {
                            scope.comboList = [];
                        }

                    }).fail(function () {
                        scope.showList = false;
                    }).always(function () {
                        scope.loadingList = false;
                        input.data("pending-list-request", null);
                        scope.$apply();
                    });
                };

                scope.updateView = function (model) {
                    ngModel.$setViewValue(model);
                    ngModel.$commitViewValue();
                    ngModel.$setValidity(config.validationErrorKey, true);
                };

                input.focus(function () {
                    ngModel.$setTouched();
                    input.select();
                });

                ngModel.$render = function(){
                    if(scope.ngModel.$viewValue){
                        var format = config["displayFormat"];
                        var text = scope.$eval(format);
                        input.val(text);
                    }
                };

                var closeComboList = function () {
                    ngModel.$rollbackViewValue();
                    scope.showList = false;
                    scope.loadingList = false;
                    scope.comboList = [];
                    input.data("pending-change-handler", null);
                    if(scope.$$phase != "$digest" && scope.$$phase != "$apply")
                        scope.$digest();
                };

                input.blur(function () {
                    setTimeout(closeComboList, 500);
                });

                input.keypress(function (event) {
                    ngModel.$setValidity(config.validationErrorKey, false);
                    ngModel.$setViewValue(null);

                    var target = $(event.target);
                    var pendingChangeHandler = target.data("pending-change-handler");
                    if (pendingChangeHandler) {
                        clearTimeout(pendingChangeHandler);
                    }
                    pendingChangeHandler = setTimeout(getList, config.delay);
                    target.data("pending-change-handler", pendingChangeHandler);
                });
            }
        };
    });

    //todo reivew this directive
    quickshopApp.directive("spgBeginLinkRequest", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var targetId = attrs["spgBeginLinkRequest"];
                $(element).click(function () {
                    quickshopService.beginLinkRequest(targetId)
                        .fail(function (error) {
                            reportError(error);
                        });
                    return false;
                });
            }
        };
    });

    //todo reivew this directive
    quickshopApp.directive("spgCancelLinkRequest", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var targetId = attrs["spgCancelLinkRequest"];
                $(element).click(function () {
                    quickshopService.cancelLinkRequest(targetId)
                        .fail(function (error) {
                            reportError(error);
                        });
                    return false;
                });
            }
        };
    });

    //todo reivew this directive
    quickshopApp.directive("spgEndLinkRequest", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element).click(function () {
                    var targetId = null;
                    if (scope.linkRequests.length > 0) {//prototyping
                        targetId = scope.linkRequests[0].sourceFieldId;
                    }

                    quickshopService.endLinkRequest(element, targetId)
                        .fail(function (error) {
                            reportError(error);
                        });
                    return false;
                });
            }
        };
    });

    quickshopApp.directive("spgMin", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                //todo not implemented.
            }
        };
    });

    quickshopApp.directive("spgMax", function (quickshopService) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                //todo not implemented.
            }
        };
    });

    //endregion

    //region controllers

    quickshopApp.controller("quickshopController", ["$scope", "quickshopService", function ($scope, quickshopService) {

        $scope.linkRequests = []; //need to select an model to complete the operation.

        $scope.operationLocks = []; //in-progress long running operations

        $scope.scrollTo = scrollTo;

        $scope.closeResult = function (resultName) {
            quickshopService.close(resultName);
        };

        $scope.getViewIds = function(){
            var result = [];
            var keys = zcl.getOwnProperties(viewMap);
            for(var i=0; i<keys.length; i++){
                var key = keys[i];
                result.push(viewMap[key].viewId);
            }

            return result;
        };

        $scope.hasClass = function(id, className){
            var element = $("#" + id);
            if(element.size() == 0)
                return false;

            return element.hasClass(className);
        };

        $scope.closeOthers = function (resultName) {
            var resultNames = $scope.getViewIds();
            for (var i = 0; i < resultNames.length; i++) {
                var otherName = resultNames[i];
                if (otherName != resultName)
                    quickshopService.close(otherName);
            }
        };

    }]);

    quickshopApp.controller("viewController", ["$scope", "$element", function ($scope, $element) {

        var id = $element.attr("id");
        var forms = $element.find("form");
        var viewDetails = findViewDetails(id);
        $scope.hideBody = false;
        $scope.master = viewDetails.model["domainObject"];

        $scope.reset = function () {
            $scope.model = angular.copy($scope.master);
            forms.each(function (index, form) {
                if($scope[form.name]){
                    $scope[form.name].$setPristine();
                }
            });
        };

        $scope.isUnchanged = function () {

            return !angular.equals($scope.master, $scope.model);
        };

        $scope.addToCollection = function(collection, key){
            var prototype = viewDetails.model.tags[key];
            collection.push(angular.copy(prototype));
        };

        $scope.removeFromCollection = function(collection, item){
            if(collection && item){
                var index = collection.indexOf(item);
                if(index >= 0){
                    collection.splice(index, 1);
                }
            }
        };

        $scope.reset();
    }]);

    //endregion

    //region jq plugins

    $.fn.starwars = function () {

        var scrollingDiv = this.find(".scrolling > div"); //todo find the line-height of 1em here to replace 50
        var initTop = this.height() + 50 * 2;//delay 2 seconds
        var endTop = -scrollingDiv.height() - 50 * 2;
        var duration = (initTop - endTop) / 50 * 1000;//100px per sec

        scrollingDiv.css("top", initTop);

        var replay = function () {

            scrollingDiv.css("top", initTop);
            scrollingDiv.animate({top: endTop}, {
                duration: duration,
                easing: "linear",
                complete: replay
            });

        };

        scrollingDiv.animate({top: endTop}, {
            duration: duration,
            easing: "linear",
            complete: replay
        });

        var perspectiveValue = Math.round(this.height() * 0.667) + "px";
        this.css("-webkit-perspective", perspectiveValue);
        this.css("perspective", perspectiveValue);
    };


    $.fn.makeTab = function () {
        var tabHeaders = this.find("a[data-tab-pane]");
        var tabContent = this.nextAll(".tab-content");

        var clickHandler = function () {
            var newLi = $(this).closest("li");
            if (newLi.hasClass("active"))
                return false;

            //deactivate old tabpage
            for (var i = 0; i < tabHeaders.length; i++) {
                var oldA = $(tabHeaders.get(i));
                var oldLi = oldA.closest("li");
                if (!oldLi.hasClass("active"))
                    continue;

                oldLi.removeClass("active");
                var oldPaneName = oldA.attr("data-tab-pane");
                tabContent.find("div[data-tab-pane=" + oldPaneName + "]").removeClass("active");
                //tabContent.find("div[data-tab-pane=" + oldPaneName + "]").addClass("visibility-hidden");
                break;
            }

            //activate new tabpage
            var newPaneName = $(this).attr("data-tab-pane");
            tabContent.find("div[data-tab-pane=" + newPaneName + "]").addClass("active");
            //tabContent.find("div[data-tab-pane=" + newPaneName + "]").removeClass("visibility-hidden");
            newLi.addClass("active");

            return false;
        };
        tabHeaders.click(clickHandler);
        return this;
    };

    //endregion

})();