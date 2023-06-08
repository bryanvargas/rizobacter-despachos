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
			 				that.getView().byId("tablaPasiciones").setModel(jModel);
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
			},

			
			onValueHelpRequest: function (oEvent) {
				debugger;
				var that = this;

				let valuesRow = oEvent.getSource().getBindingContext().getObject();
				var oInput = oEvent.getSource(),
					sInputValue = oEvent.getSource().getValue(),
					oView = this.getView();

				if (this._oValueHelpDialog) {
					this._oValueHelpDialog.destroy();
				}

				this._chargDialogInput = oInput;
				Fragment.load({
					id: oView.getId(),
					name: "ar.com.rizobacter.despacho.view.fragment.ValueHelpDialog",
					controller: this
				}).then(function (oDialog) {
					that._oValueHelpDialog = oDialog;
					oView.addDependent(oDialog);
					var filtro = [];
					debugger;
					var sInputId = /[a-z]+$/.exec((/EntregasPos--[a-z]+/.exec(oInput.getId())[0]))[0];
					switch (sInputId) {
						case "charg":
							oDialog.bindAggregation("items", {
								path: "lotes>/ZCDS_GETLOTES(p_matnr='" + valuesRow.Matnr + "',p_werks='" + valuesRow.Werks + "',p_lgort='" + valuesRow.Lgort + "')/Set",
								//path: "lotes>/ZCDS_GETLOTES('" + valuesRow.Matnr + "'," + "'"  + valuesRow.Werks + "'," +  "'" + valuesRow.Lgort + "')/Set",
								//filters: [new Filter('Charg', FilterOperator.EQ, sInputValue)],
								template: new sap.m.StandardListItem({
									title: '{lotes>Lote}',
									info: 'Cantidad',
									description: '{lotes>Stock}'
									
								})
							});
							that._oValueHelpDialog._Field = "charg";
							break;


					}
					if (sInputId === "charg") {
						oDialog.getBinding("items").filter([
							// new Filter("Kunnr", FilterOperator.EQ, sInputValue),
							// new Filter("Name", FilterOperator.EQ, sInputValue)
						]);
					}

					oDialog.open(sInputValue);

					return oDialog;
				});

			},
			onValueHelpSearch: function (oEvent) {
				var sValue = oEvent.getParameter("value");

				if (this._oValueHelpDialog._Field === "charg") {
					oEvent.getSource().getBinding("items").filter([
						//new Filter("Kunnr", FilterOperator.Contains, sValue)
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

				this._chargDialogInput.setValue(oSelectedItem.getTitle());
			},

			 onSavePicking: function () {
			 	debugger;
			 	var oItem= this.getView().byId("tablaPasiciones").getSelectedItem();
				if (oItem !== null) {
					

			 	var oEntregas = oItem.getBindingContext().getObject();
			 	var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
				var textArea = this.getView().byId("descTextarea").getValue();
				//  var body = {
				// 	Vbeln:oEntregas.Vbeln,
				// 	Posnr:oEntregas.Posnr,
				// 	Matnr:oEntregas.Matnr,
				// 	Werks:oEntregas.Werks,					
				// 	Lgort:oEntregas.Lgort,	
				// 	Lfimg:oEntregas.Lfimg,
				// 	Pikmg:oEntregas.Pikmg,
				// 	Charg:oEntregas.Charg
				// };
				var body = {
					Vbeln : "80001456",
					Textocab: textArea,
					nav_entdp_to_pick: [
						{
							// Vbeln:"80001456",
							// Posnr:"000010",
							// Matnr:"200012",
							// Werks: "1010",					
							// Lgort:"1105",	
							// Lfimg:"1.000",
							// Pikmg:"1.000",
							// Charg:"0000000247"
							// 	Vbeln:oEntregas.Vbeln,
				Posnr:oEntregas.Posnr,
				Matnr:oEntregas.Matnr,
				Werks:oEntregas.Werks,					
				Lgort:oEntregas.Lgort,	
				Lfimg:oEntregas.Lfimg,
				Pikmg:oEntregas.Pikmg,
				Charg:oEntregas.Charg
						}

					],
					nav_entdp_to_ret: [
						{
							Type:"",
							Id:"",
							Number:"",
							Message:""
						}
					]
				};

				this.getView().getModel("entregas").create("/EntregaDPSet", body, {
					success: function () {
						MessageToast.show("Se grabo exitosamente");
						console.log("Se grabo exitosamente");
					}.bind(this),
					error: function (e) {
						MessageToast.show("No se realizo el Picking");
						console.log("Se grabo NO exitosamente");
					}.bind(this)
				});

			} else {
					MessageToast.show('Seleccione una entrega');
				}
			 }
		});
	});   