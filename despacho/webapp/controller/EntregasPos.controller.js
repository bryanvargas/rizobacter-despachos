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
			onInit: function () {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("RouteEntregasPos").attachPatternMatched(this._onObjectMatch, this);
			},

			 _onObjectMatch: function (oEvent){
			 	var that = this;
			 	var vbeln = oEvent.getParameter("arguments").Vbeln,  
			 	    aFilter = [];

			 		aFilter.push(new Filter('Vbeln', FilterOperator.EQ , vbeln));

			 		this.getView().getModel("entregas").read("/EntregaSet('" + vbeln + "')/nav_ent_to_pick", {
			 			filters: aFilter,
			 			success: function (odata) {
							debugger;
			 				var jModel = new sap.ui.model.json.JSONModel(odata);
			 				that.getView().byId("tablaEntregasCab").setModel(jModel);
			 			}, error: function (oError) {
			 			}.bind(that)
			 		})
			 },

			_onReadFilters: function () {
				debugger;
				var that = this;

				var oModel = this.getOwnerComponent().getModel();
				var oFilter = new sap.ui.model.Filter('Vbeln', FilterOperator.EQ, '80001614');

				oModel.read("/EntPickSet", {
					filters: [oFilter],
					success: function (odata) {
						var jModel = new sap.ui.model.json.JSONModel(odata);
						that.getView().byId("tablaPos").setModel(jModel);
					}, error: function (oError) {
						console.log(oError);
					}
				})
			}
		});
	});   