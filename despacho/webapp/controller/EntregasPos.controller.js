sap.ui.define(
	['./BaseController',
	"sap/ui/core/routing/History",
		'sap/m/MessageToast',
		'sap/ui/core/Fragment',
		'sap/ui/model/json/JSONModel',
		"sap/m/PDFViewer",
		'../model/DespachoFormatter',
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (BaseController, History, MessageToast, Fragment, JSONModel, PDFViewer, Despachoformatter, Filter, FilterOperator) {
		'use strict';

		return BaseController.extend("ar.com.rizobacter.despacho.controller.EntregasPos", {
			
			formatter: Despachoformatter,
			/**
			 * @override
			 */
			onInit: function () {
				debugger;
				this._countId = 0;
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("RouteEntregasPos").attachPatternMatched(this._onObjectMatch, this);
				
			},

			_onObjectMatch: function (oEvent) {
				var that = this;
				var vbeln = oEvent.getParameter("arguments").Vbeln,
					aFilter = [];

				aFilter.push(new Filter('Vbeln', FilterOperator.EQ, vbeln));
				
				this.getView().byId("descTextarea").setValue("");
				

				this.getView().getModel("entregas").read("/EntregaSet('" + vbeln + "')/nav_ent_to_pick", {
					filters: aFilter,
					success: function (odata) {
						debugger;
						var jModel = new sap.ui.model.json.JSONModel(odata);
						that.getView().byId("tablaPasiciones").setModel(jModel);
						let valueDescrip = '';
						if (jModel.oData.results[0] !== undefined) {
							valueDescrip = jModel.oData.results[0].TextoCab;
						}
						that.getView().byId("descTextarea").setValue(valueDescrip);
					}, error: function (oError) {
					}.bind(that)
				})
			},

			onRefreshPos: function (oEvent) {
				debugger;

				var oModel = this.getOwnerComponent().getModel();
				var that = this;
				var vbeln = this.getView().byId("tablaPasiciones").getItems()[0].getCells()[1].getText(),
				oFilter = [];

				oFilter.push(new Filter('Vbeln', FilterOperator.EQ, vbeln));
				this.getView().setBusy(true);				
				var that = this;
				this.getView().getModel("entregas").read("/EntregaSet('" + vbeln + "')/nav_ent_to_pick", {
					filters: oFilter,
					success: function (odata) {
						debugger;
						that.getView().setBusy(false);
						var jModel = new sap.ui.model.json.JSONModel(odata);
						that.getView().byId("tablaPasiciones").setModel(jModel);
						let valueDescrip = '';
						if (jModel.oData.results[0] !== undefined) {
							valueDescrip = jModel.oData.results[0].TextoCab;
						}
						that.getView().byId("descTextarea").setValue(valueDescrip);

					const oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("Despacho", { vbeln: 'X-' + vbeln });	
					}, error: function (oError) {
					}.bind(that)
				})
			},


			onValueHelpRequest: function (oEvent) {
				debugger;
				var oView = this.getView();

				var oModel = this.getOwnerComponent().getModel("lotes");

				var newModel = new sap.ui.model.json.JSONModel();
				if (oEvent.getSource().getBindingContext() !== undefined) {
					this._valuesRow = oEvent.getSource().getBindingContext().getObject();
				}
				

				var that = this;

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
					var sInputId = "charg"; ///[a-z]+$/.exec((/EntregasPos--[a-z]+/.exec(oInput.getId())[0]))[0];
					switch (sInputId) {
						case "charg":
							oDialog.bindAggregation("items", {
								path: "lotes>/ZCDS_GETLOTES(p_matnr='" + that._oEntregas.Matnr + "',p_werks='" + that._oEntregas.Werks + "',p_lgort='" + that._oEntregas.Lgort + "')/Set",
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
				var checkPickingError = false;
				var vbeln = "";
				//if (oItem !== null) {
					//var oEntregas = oItem.getBindingContext().getObject();
					var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
					var textArea = this.getView().byId("descTextarea").getValue();

					if (textArea === "") {
						MessageToast.show(oResourceBundle.getText("errores.detalleExp"));
						
						this.getView().byId("descTextarea").focus();
						checkPickingError = true;
						return;
					}
					var body = {
						Vbeln: "",
						Textocab: textArea,						
						nav_entdp_to_pick: [
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
						var entrega = {};
						vbeln = element.getCells()[1].getText();
						entrega.Vbeln = element.getCells()[1].getText();
						entrega.Posnr = element.getCells()[2].getText();
						entrega.Matnr = element.getCells()[3].getText();
						entrega.Werks = element.getCells()[5].getText();
						entrega.Lgort = element.getCells()[6].getText();
						entrega.Lfimg = element.getCells()[7].getText();
						entrega.Pikmg = element.getCells()[8]._lastValue;
						if (entrega.Pikmg === "") {
							MessageToast.show('Por favor completar Cantidad Picking');
							element.getCells()[8].focus();
							checkPickingError = true;
							return;
						}
						entrega.Charg = element.getCells()[9]._lastValue;
						if (entrega.Charg === "") {
							MessageToast.show('Por favor completar Lote');
							element.getCells()[9].focus();
							checkPickingError = true;
							return;
						}
						body.nav_entdp_to_pick.push(entrega);
					});

					body.Vbeln = vbeln;


					debugger;
					if (!checkPickingError) {


						this.getView().setBusy(true);
						this.getView().getModel("entregas").create("/EntregaDPSet", body, {
							success: function (oData, response) {

								this.getView().setBusy(false);

								if (response.data.nav_entdp_to_ret.results[0].Type === 'S') {
									debugger;
									this.onRefreshPos();
									//const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
									//oRouter.navTo("Despacho", {}, true);	
									
									//TODO //this._onPrintRemito(oData.Vbeln)

									debugger;
								} else {
									MessageToast.show(response.data.nav_entdp_to_ret.results[0].Message, {
										duration: 4000
									});
								}

							}.bind(this),
							error: function (e, response) {
								this.getView().setBusy(false);
								if (e !== undefined) {
									var message = JSON.parse(e.responseText).error.message.value
									// if (e.statusCode === '400') {
									// 	MessageToast.show("Ingrese los campos obligatorios de cantidad de picking o lote", {
									// 		duration: 4000
									// 	});	
									// } else {
									// 	MessageToast.show(message, {
									// 		duration: 4000
									// 	});
									// }
									MessageToast.show(message, {
										duration: 4000
									});
								};

								if (response !== undefined) {
									MessageToast.show(response.data.nav_entdp_to_ret.results[0].Message, {
										duration: 4000
									});
								};

								this.getView().setBusy(false);
							}.bind(this),
							finally: function () {
								debugger;
							} 
						});

			},


			onAddLine: function (oEvent) {
				debugger;

				var oItem = this.getView().byId("tablaPasiciones").getSelectedItem();
				if (oItem === null) {
					MessageToast.show('Seleccione una entrega');
				} else {

					this._oEntregas = oItem.getBindingContext().getObject();
					var oItem = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Button({
								icon: "sap-icon://delete",
								type: "Reject",
								press: [this.onRemoveLine, this]
							}),
							new sap.m.Text({ text: this._oEntregas.Vbeln }),
							new sap.m.Text({ text:  Despachoformatter.quitarCero(this._oEntregas.Posnr) }),
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

						]
					});

					//var oItem = this.getView().byId("tablaPasiciones").getSelectedItem();
					var indexItem = 0;
					var flag = '';
					this.getView().byId("tablaPasiciones").getItems().forEach(element => {

						if (element.getId() === this.getView().byId("tablaPasiciones").getSelectedItem().getId() && flag !== 'X') {					
							
							flag = 'X'
						}
						if (flag !== 'X') {
							indexItem++;
						}
					});

					var oTable = this.getView().byId("tablaPasiciones");
					//let indexTable = this.getView().byId("tablaPasiciones").indexOfItem(this.getView().byId("tablaPasiciones").getSelectedItem());
					let index = parseInt(this.getView().byId("tablaPasiciones").getSelectedContextPaths()[0].split("/")[2]) + 1;
					oTable.insertItem(oItem, indexItem + 1);
					this._countId = this._countId + 1;
					flag = '';


				}
			},

			onRemoveLine: function (oEvent) {
				var oTable = this.getView().byId("tablaPasiciones");
				oTable.removeItem(oEvent.getSource().getParent());

			},

			onValueHelpSearch: function (oEvent) {
                debugger;
                var sValue = oEvent.getParameter("value");

                if (this._oValueHelpDialog._Field === "charg") {
                    oEvent.getSource().getBinding("items").filter([
                        new Filter("Lote", FilterOperator.Contains, sValue)
                    ]);
                }
            },


            _onPrintRemito: function (nro_doc) {
                debugger;
                // var oItem = this.getView().byId("tablaPasiciones").getSelectedItem();
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                // if (oItem !== null) {
					//let vbeln = oItem.getBindingContext().getObject().Vbeln;
                    let opdfViewer = new PDFViewer();
                    this.getView().addDependent(opdfViewer);
                    let sServiceURL = this.getView().getModel("entregas").sServiceUrl;
                    let sSource = sServiceURL + "/EntregaSet('" + nro_doc + "')/$value";
				   opdfViewer.setSource(sSource);
				   opdfViewer.setTitle(oResourceBundle.getText("textos.globales.printPDF", [nro_doc]));
				    opdfViewer.open();

            },
			_getEntregaPos: function (nro_doc) {
				var that = this,
				//var vbeln = oEvent.getParameter("arguments").Vbeln,
					aFilter = [];

				aFilter.push(new Filter('Vbeln', FilterOperator.EQ, nro_doc));

				this.getView().getModel("entregas").read("/EntregaSet('" + nro_doc + "')/nav_ent_to_pick", {
					filters: aFilter,
					success: function (odata) {
						debugger;
						var jModel = new sap.ui.model.json.JSONModel(odata);
						that.getView().byId("tablaPasiciones").setModel(jModel);
					}, error: function (oError) {
					}.bind(that)
				})
            },			

			// onNavBack: function () {
			// 	debugger;
			// 	var oHistory = History.getInstance();
			// 	var sPreviousHash = oHistory.getPreviousHash();
			// 	this.getView().getModel("entregas").refresh(true);
			// 	this.getView().getModel("entregas").read("/EntCabSet", {
			// 		filters: [aFilter],
			// 		success: function (odata) {
			// 			var jModel = new sap.ui.model.json.JSONModel(odata);
			// 			this.getView().byId("tablaEntregas").setModel(jModel);
			// 		}, error: function (oError) {
			// 			debugger;
			// 			this.getView().byId("tablaEntregas").setModel(models.entCabModel());
			// 		}.bind(this)
			// 	})
			// 	if (sPreviousHash !== undefined) {
			// 		window.history.go(-1);
			// 	} else {
			// 		var oRouter = this.getOwnerComponent().getRouter();
			// 		oRouter.navTo("Despacho", {}, true);
			// 	}
			// }
		});
	});   