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

            onValueHelpRequest: function (oEvent) {
                debugger;
                var that = this;
                var oInput = oEvent.getSource(),
                    sInputValue = oEvent.getSource().getValue(),
                    oView = this.getView();

                if (this._oValueHelpDialog) {
                    this._oValueHelpDialog.destroy();
                }

                this._kunnrDialogInput = oInput;
                Fragment.load({
                    id: oView.getId(),
                    name: "ar.com.rizobacter.despacho.view.fragment.ValueHelpDialog",
                    controller: this
                }).then(function (oDialog) {
                    that._oValueHelpDialog = oDialog;
                    oView.addDependent(oDialog);
                    var filtro = [];
                    var sInputId = /[a-z]+$/.exec((/Historicos--[a-z]+/.exec(oInput.getId())[0]))[0];
                    switch (sInputId) {
                        case "kunnr":
                            oDialog.bindAggregation("items", {
                                path: 'entregas>/F4kunnrSet',
                                filters: [new Filter('Kunnr', FilterOperator.EQ, sInputValue)],
                                template: new sap.m.StandardListItem({
                                    title: '{entregas>Kunnr}',
                                    description: '{entregas>Name}'
                                })
                            });
                            that._oValueHelpDialog._Field = "kunnr";
                            break;
                        case "matnr":
                            oDialog.bindAggregation("items", {
                                path: 'materiales>/ZCDS_GETMATERIAL',
                                //filters: [new Filter('Material', FilterOperator.EQ, sInputValue)],
                                template: new sap.m.StandardListItem({
                                    title: '{materiales>Material}',
                                    description: '{materiales>Descripcion}'
                                })
                            });
                            that._oValueHelpDialog._Field = "matnr";
                            break;


                    }
                    // if (sInputId === "kunnr") {
                    //     oDialog.getBinding("items").filter([
                    //         new Filter("Kunnr", FilterOperator.EQ, sInputValue),
                    //         new Filter("Name", FilterOperator.EQ, sInputValue)
                    //     ]);
                    // } else if (sInputId === "matnr") {

                    //     oDialog.getBinding("items").filter([
                    //         new Filter("Material", FilterOperator.EQ, sInputValue),
                    //         new Filter("Descripcion", FilterOperator.EQ, sInputValue)
                    //     ]);
                    // }

                    oDialog.open(sInputValue);

                    return oDialog;
                });

            },
            onValueHelpSearch: function (oEvent) {
                debugger;
                var sValue = oEvent.getParameter("value");

                if (this._oValueHelpDialog._Field === "kunnr") {
                    oEvent.getSource().getBinding("items").filter([
                        new Filter("Kunnr", FilterOperator.Contains, sValue)
                    ]);
                }
                //var sValue = oEvent.getParameter("value");
                //var oFilter = new Filter("Kunnr", FilterOperator.Contains, sValue);

                //oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                this._kunnrDialogInput.setValue(oSelectedItem.getTitle());
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