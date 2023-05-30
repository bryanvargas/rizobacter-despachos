sap.ui.define(
	['./BaseController',
		'sap/m/MessageToast',
		'sap/ui/core/Fragment',
		'sap/ui/model/json/JSONModel',
		'../model/DespachoFormatter',
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (BaseController, MessageToast, Fragment, JSONModel, Despachoformatter, Filter, FilterOperator) {
		'use strict';

		return BaseController.extend("ar.com.rizobacter.despacho.controller.EntregasPos", {
			/**
			 * @override
			 */
			onInit: function() {
				debugger;
				const oRouter = this.getOwnerComponent().getRouter(); //sap.ui.core.UIComponent.getRouterFor(this);
				
				oRouter.getRoute("RouteEntregasPos").attachBeforeMatched(this._onObjectMatch, this);
			
			},

			_onObjectMatch: function (oEvent){
				debugger;
				this.getView().bindElement({
					path: "/" + window.decodeURIComponent(oEvent.getParameter("arguments").invoicePath),
					model: "entregas"
				});
			}
        });
	});   