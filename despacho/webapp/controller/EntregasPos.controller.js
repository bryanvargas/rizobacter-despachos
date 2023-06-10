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
				debugger;
				const oPayerModel = this.getView().getModel("Lotes");
				this._countId = 0;
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("RouteEntregasPos").attachPatternMatched(this._onObjectMatch, this);
			},

			_onObjectMatch: function (oEvent) {
				var that = this;
				var vbeln = oEvent.getParameter("arguments").Vbeln,
					aFilter = [];

				aFilter.push(new Filter('Vbeln', FilterOperator.EQ, vbeln));

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
				var oView = this.getView();

				var oModel = this.getOwnerComponent().getModel("lotes");

				var newModel = new sap.ui.model.json.JSONModel();

				if (this._valuesRow === null || this._valuesRow === undefined) {
				 	this._valuesRow = oEvent.getSource().getBindingContext().getObject();

				};
				



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
								path: "lotes>/ZCDS_GETLOTES(p_matnr='" + that._valuesRow.Matnr + "',p_werks='" + that._valuesRow.Werks + "')/Set",
								//path: "lotes>/ZCDS_GETLOTES('" + valuesRow.Matnr + "'," + "'"  + valuesRow.Werks + "'," +  "'" + valuesRow.Lgort + "')/Set",
								//filters: [new Filter('Charg', FilterOperator.EQ, sInputValue)],
								template: new sap.m.StandardListItem({
									title: '{lotes>Lote}',
									info: '{lotes>Almacen}',
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
			onValueHelpReques2t: function (oEvent) {
				debugger;
				var oView = this.getView();

				if (!this._pValueHelpDialog) {
					this._pValueHelpDialog = Fragment.load({
						id: oView.getId(),
						name: "ar.com.rizobacter.despacho.view.fragment.LotesValueHelpDialog",
						controller: this
					}).then(function (oValueHelpDialog) {
						oView.addDependent(oValueHelpDialog);
						return oValueHelpDialog;
					});
				}
				this._pValueHelpDialog.then(function(oValueHelpDialog) {
					this._configValueHelpDialog();
					oValueHelpDialog.open();
				}.bind(this));
			},

			_configValueHelpDialog: function () {
				var sInputValue = this.byId("productInput").getValue(),
					oModel = this.getView().getModel(),
					aProducts = oModel.getProperty("/ProductCollection");
	
				aProducts.forEach(function (oProduct) {
					oProduct.selected = (oProduct.Name === sInputValue);
				});
				oModel.setProperty("/ProductCollection", aProducts);
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

				var oItem = this.getView().byId("tablaPasiciones").getSelectedItem();
				var entrega = {};
				if (oItem !== null) {


					// // ***************************************************************************
					// this.oQuestionDialog = new sap.m.Dialog({
					// 	title: "Picking",
					// 	type: 'Message',
					// 	content: [
					// 		new sap.m.Label({
					// 			text: "¿Desea realizar el picking?",
					// 			labelFor: 'rejectDialogTextarea'
					// 		})
					// 	],
					// 	beginButton: new sap.m.Button({
					// 		type: sap.m.ButtonType.Emphasized,
					// 		text: 'Confirmar'
					// 	}),
					// 	endButton: new sap.m.Button({
					// 		type: sap.m.ButtonType.Reject,
					// 		text: 'Cancelar',
					// 		press: function () {
					// 			this.onCancelConfirm();
					// 		}.bind(this)
					// 	})
					// });
					// this.oQuestionDialog.open();

					// // *****************************************************************************


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
						Vbeln: oEntregas.Vbeln,
						Textocab: textArea,
						nav_entdp_to_pick: [
							// 		{
							// 			// Vbeln:"80001456",
							// 			// Posnr:"000010",
							// 			// Matnr:"200012",
							// 			// Werks: "1010",					
							// 			// Lgort:"1105",	
							// 			// Lfimg:"1.000",
							// 			// Pikmg:"1.000",
							// 			// Charg:"0000000247"
							// 			// 	Vbeln:oEntregas.Vbeln,
							// Posnr:oEntregas.Posnr,
							// Matnr:oEntregas.Matnr,
							// Werks:oEntregas.Werks,					
							// Lgort:oEntregas.Lgort,	
							// Lfimg:oEntregas.Lfimg,
							// Pikmg:oEntregas.Pikmg,
							// Charg:oEntregas.Charg
							// 		}

						],
						nav_entdp_to_ret: [
							{
								Type: "",
								Id: "",
								Number: "",
								Message: ""
							}
						]
					};

					this.getView().byId("tablaPasiciones").getItems().forEach(element => {
						entrega.Vbeln = element.getCells()[0].getText();
						entrega.Posnr = element.getCells()[1].getText();
						entrega.Matnr = element.getCells()[2].getText();
						entrega.Werks = element.getCells()[4].getText();
						entrega.Lgort = element.getCells()[5].getText();
						entrega.Lfimg = element.getCells()[6].getText();
						entrega.Pikmg = element.getCells()[7]._lastValue;
						entrega.Charg = element.getCells()[8].getValue();
						body.nav_entdp_to_pick.push(entrega);
					});




					debugger;


					this.getView().getModel("entregas").create("/EntregaDPSet", body, {
						success: function (oData, response) {
							MessageToast.show(response.data.nav_entdp_to_ret.results[0].Message);
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
			},
			

			onAddLine: function (oEvent) {

				debugger;

				var oItem = this.getView().byId("tablaPasiciones").getSelectedItem();
				this._oEntregas = oItem.getBindingContext().getObject();
				var oItem = new sap.m.ColumnListItem({
					cells: [new sap.m.Text({ text: this._oEntregas.Vbeln }),
					new sap.m.Text({ text: this._oEntregas.Posnr }),
					new sap.m.Text({ text: this._oEntregas.Matnr }),
					new sap.m.Text({ text: this._oEntregas.MatnrDesc }),
					new sap.m.Text({ text: this._oEntregas.Werks }),
					new sap.m.Text({ text: this._oEntregas.Lgort }),
					new sap.m.Text({ text: this._oEntregas.Lfimg }),
					new sap.m.Input({ type: "Text", editable: true }),
					new sap.m.Input({
						id: "chargInput" + this._countId,
						showSuggestion: true,
						showValueHelp: true,
						valueHelpOnly: false,
						editable: true,
						enabled: true,
						valueHelpRequest: [this.onValueHelpRequest, this]
					}),
					new sap.m.Text({ text: this._oEntregas.Vrkme }),
					new sap.m.Button({
						icon: "sap-icon://delete",
						type: "Reject",
						press: [this.remove, this]
					})]
				});

				var oTable = this.getView().byId("tablaPasiciones");
				oTable.addItem(oItem, 1);

				this._countId = this._countId + 1;
			},

			onRemove: function (oEvent) {
				var oListBox = this.byId('myListBox'); //this refers to view's controller
				oModel.read(
					"/Schema(" + "'" + data + "')",
					null, [],
					true,
					function (oData, oResponse) {
						var oItem = new sap.ui.core.ListItem({
							text: "{ProductName}"
						});
						var oJSModel = new sap.ui.model.json.JSONModel(oData);
						oListBox.setModel(oJSModel, "myModel");
						oListBox.bindAggregation("items", {
							path: "myModel>/items",
							template: oItem
						});
					},
					function (oError) {
						sap.ui.commons.MessageBox.alert("Error ! Username is not found !");
					}
				);
			}
		});
	});   