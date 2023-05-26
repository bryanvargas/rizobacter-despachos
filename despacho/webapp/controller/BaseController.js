sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function (Controller, History, UIComponent, JSONModel, MessageToast) {
	"use strict";

	return Controller.extend("ar.com.rizobacter.despacho.controller.BaseController", {

		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("Principal");
			}
		},

		createEntry: function (entidad, datos) {
			var oModel = this.getOwnerComponent().getModel();
			return new Promise(function (resolve, reject) {
				oModel.create(entidad, datos, {
					success: function (res) {
						resolve(new JSONModel(res));
					},
					error: function (err) {
						reject(err);
					}
				});
			});
		},

		getSingleData: function (entidad, filtros, cadena) {
			var oModel = this.getOwnerComponent().getModel();
			return new Promise(function (resolve, reject) {
				oModel.read(entidad, {
					filters: filtros,
					urlParameters: cadena,
					success: function (response) {
						resolve(response);
					},
					error: function (error) {
						reject(error);
					}
				});
			});
		},
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},
		myNavBack: function (sRoute, mData) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo(sRoute, mData, bReplace);
			}
		}
	});
});