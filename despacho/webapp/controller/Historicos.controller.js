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

        return BaseController.extend("ar.com.rizobacter.despacho.controller.Historicos", {
            /**
             * @override
             */
            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteHistoricos").attachPatternMatched(this._onObjectMatch, this);
            },

            _onObjectMatch: function (oEvent) {
                var that = this;

                this.getView().getModel("entregas").read("/EntHistSet", {
                    success: function (odata) {
                        debugger;
                        var jModel = new sap.ui.model.json.JSONModel(odata);
                        that.getView().byId("tablaHistoricos").setModel(jModel);
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