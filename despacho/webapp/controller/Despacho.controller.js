sap.ui.define(
	['./BaseController',
		'sap/m/MessageToast',
		'sap/ui/core/Fragment',
		'sap/ui/model/json/JSONModel',
		"sap/m/PDFViewer",
		'../model/DespachoFormatter',
		'../model/models',
		"sap/ui/Device",
		"sap/ui/model/Sorter",
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (BaseController, MessageToast, Fragment, JSONModel, PDFViewer, Despachoformatter, models, Device, Sorter, Filter, FilterOperator) {
		'use strict';

		return BaseController.extend("ar.com.rizobacter.despacho.controller.Despacho", {
			formatter: Despachoformatter,
			onInit: function () {

				const oFiltrosEntregas = new sap.ui.model.json.JSONModel({
					Vbeln: ""
				});

				this._mViewSettingsDialogs = {};

				this.getView().setModel(oFiltrosEntregas, "oFiltrosEntregas");

				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("tablaEntregas");

				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

				oViewModel = new JSONModel({
					worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [window.location.href]),
					tableBusyDelay: 0
				});
				this.setModel(oViewModel, "worklistView");

				oTable.attachEventOnce("updateFinished", function () {
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});


				this._oTextos = this.getOwnerComponent().getModel("i18n").getResourceBundle();
				this._oGlobalBusyDialog = new sap.m.BusyDialog();
				this._getEntregas();
				this._filtersModel();

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("Despacho").attachPatternMatched(this._onObjectMatch, this);
			},

			_onObjectMatch: function (oEvent) {
				debugger;

				var vbeln = oEvent.getParameter("arguments").vbeln;

				if (vbeln !== undefined && vbeln.split("-")[0] === 'X') {
					this.onFilterEntregas(oEvent);

					this._onPrintRemito(vbeln.split("-")[1]);

				}
			},

			onSearch: function (oEvent) {
				debugger;
				const oViewModel = this.getView().getModel("filters");
				const oTablaEntregas = this.getView().byId("tablaEntregas");
				const oBinding = oTablaEntregas.getBinding("items");

				let oFilters = [];

				if (oViewModel.getProperty("/Vbeln")) {
					oFilters.push(new Filter("Vbeln", FilterOperator.Contains, oViewModel.getProperty("/Vbeln")));
				};

				oBinding.filter(oFilters);
			},

			onFilterEntregas: function (oEvent) {
				debugger;
				const aFilter = [];
				var that = this;
				var wadat = that.byId("wadatInput").getValue();
				var kunnr = that.byId("kunnrInput").getValue();
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "YYYYMMdd"
				});

				if (wadat !== "") {
					var wadat = that.byId("wadatInput").getValue(),
						oDate = oDateFormat.format(oDateFormat.parse(wadat)),
						dateIn = oDateFormat.format(oDateFormat.parse(wadat.split('-')[0].trim())),
						dateOut = oDateFormat.format(oDateFormat.parse(wadat.split('-')[1].trim()));
					aFilter.push(new Filter("Wadat", sap.ui.model.FilterOperator.BT, dateIn, dateOut));
				};

				if (kunnr !== "") {
					aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
				};

				if (kunnr !== "" && wadat !== "") {
					aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
					aFilter.push(new Filter("Wadat", sap.ui.model.FilterOperator.EQ, oDate));
				};


				this.getView().getModel("entregas").read("/EntCabSet", {
					filters: [aFilter],
					success: function (odata) {
						var jModel = new sap.ui.model.json.JSONModel(odata);
						that.getView().byId("tablaEntregas").setModel(jModel);
					}, error: function (oError) {
						debugger;
						that.getView().byId("tablaEntregas").setModel(models.entCabModel());
					}.bind(that)
				})
			},

			onCleanFilterEntregas: function () {
				var that = this;
				if (that.byId("wadatInput").getValue() !== "" || that.byId("kunnrInput").getValue() !== "") {
					that.byId("wadatInput").setValue("");
					that.byId("kunnrInput").setValue("");
					this._getEntregas();
				}
			},


			_getEntregas: function () {
				debugger;
				this.getOwnerComponent().getModel("entregas").read("/EntCabSet", {
					success: function (odata) {
						this.getView().setBusy(false);
						var jModel = new sap.ui.model.json.JSONModel(odata);
						this.getView().byId("tablaEntregas").setModel(jModel);
					}.bind(this),
					error: function (oError) {
						console.log(oError)
					}.bind(this)
				});
			},

			_filtersModel: function () {
				let oModel = {
					Vbeln: ""
				};
				this.getView().setModel(new JSONModel(oModel), "filters");
			},

			_filter: function () {
				if (this._oGlobalFilter) {
					const oList = this.getView().byId("table");
					const oBinding = oList.getBinding("items");
					oBinding.filter(this._oGlobalFilter);
				}
			},

			onUpdateFinished: function (oEvent) {
				debugger;
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("infoViaticos", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},


			onAddLine: function (oEvent) {
				debugger;
				
				var oView = this.getView();

				if (!this.byId("mainDialog")) {
					Fragment.load({
						Id: oView.getId(),
						name: "ar.com.rizobacter.despacho.view.fragment.DialogDespacho"
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.open();
					});

				} else {
					this.byId("mainDialog").open();
				}
				
			},

			onOpenDialogRemito: function (oEvent) {
				debugger;
				var oItem = this.getView().byId("table").getSelectedItem();
				const oView = this.getView();
				if (!this.byId("impRemitoDialog")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.rizobacter.despacho.view.ImprimirRemito",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog)
						oView.addDependent(oDialog);
						oDialog.open();

					});
				} else {
					this.byId("impRemitoDialog").open();
				}
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
					var sInputId = /[a-z]+$/.exec((/Despacho--[a-z]+/.exec(oInput.getId())[0]))[0];
					switch (sInputId) {
						case "kunnr":
							oDialog.bindAggregation("items", {
								path: 'entregas>/F4kunnrSet',
								
								template: new sap.m.StandardListItem({
									title: '{entregas>Kunnr}',

									description: '{entregas>Name}'
								})
							});
							that._oValueHelpDialog._Field = "kunnr";
							break;


					}
					if (sInputId === "kunnr") {
						oDialog.getBinding("items").filter([
							new Filter("Kunnr", FilterOperator.EQ, sInputValue)
							
						]);
					}

					oDialog.open(sInputValue);

					return oDialog;
				});

			},
			onValueHelpSearch: function (oEvent) {
				
				debugger;
				var sValue = oEvent.getParameter("value");
				var oFilter = new Filter("Kunnr", FilterOperator.Contains, sValue);

				var oBinding = oEvent.getSource().getBinding("items");

				oBinding.filter(oFilter);
			},

			onValueHelpClose: function (oEvent) {
				var oSelectedItem = oEvent.getParameter("selectedItem");
				oEvent.getSource().getBinding("items").filter([]);

				if (!oSelectedItem) {
					return;
				}

				this._kunnrDialogInput.setValue(oSelectedItem.getTitle());
			},

			navegateToEntregasPos: function (oEvent) {
				debugger;
				var vbeln = oEvent.getSource().getBindingContext().getObject().Vbeln;
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("RouteEntregasPos", {
					Vbeln: vbeln
				})
			},

			onExportxlsEntregas: function (oEvent) {
				if (this.getView().byId("tablaEntregas").getItems().length > 0) {

					this._oGlobalBusyDialog.setText("DescargandoInformacion");
					this._oGlobalBusyDialog.open();
					var oLibro = this._crearLibroExcel();
					var oDatosResultados = this._armarDatos3WMParkeadas(); 
					this._agregarPaginaLibroExcel(oLibro, oDatosResultados, "Entregas");

					var filename = "Reporte Despachos - Entregas " + new Date().toDateString();

					this._generarExcel(oLibro, filename);
					this._oGlobalBusyDialog.close();

				} else {

					sap.m.MessageToast.show("Error al generar XLS");
				}
			},

			_crearLibroExcel: function () {
				return {
					SheetNames: [],
					Sheets: {}
				}
			},

			_armarDatos3WMParkeadas: function () {

				var oTablaPrecargados = this.getView().byId("tablaEntregas");
				var aItems = oTablaPrecargados.getItems();
				var aDatos3wn = [];

				//Agregar encabezados columnas
				aDatos3wn.push(this._agregarLineaHojaExcel("", [
					this._oTextos.getText("entrega.vbeln"),
					this._oTextos.getText("entrega.kunnr"),
					this._oTextos.getText("entrega.kunnrDesc"),
					this._oTextos.getText("entrega.matnr"),
					this._oTextos.getText("entrega.matnrDesc"),
					this._oTextos.getText("entrega.lfimg"),
					this._oTextos.getText("entrega.vrkme"),
					this._oTextos.getText("entrega.wadat"),
					this._oTextos.getText("entrega.werks"),

				]));

				for (var i = 0; i < aItems.length; i++) {
					var oResultados = aItems[i].getBindingContext().getObject();
					var sEstadoDescrip;

					switch (oResultados.Statdoc) {

						case "00":
							sEstadoDescrip = "Pre-Carga";
							break;
						case "01":
							sEstadoDescrip = "Pre-Carga con error";
							break;
						case "02":
							sEstadoDescrip = "Error en Parkeo";
							break;
						case "03":
							sEstadoDescrip = "Parkeado cabecera";
							break;
						case "04":
							sEstadoDescrip = "Parkeado completo con error";
							break;
						case "05":
							sEstadoDescrip = "Parkeo completo OK";
							break;
						case "06":
							sEstadoDescrip = "Error de contabilización";
							break;
						case "07":
							sEstadoDescrip = "Contabilizado";
							break;
					}

					aDatos3wn.push(this._agregarLineaHojaExcel("", [
						oResultados.Vbeln,

						oResultados.Kunnr,
						oResultados.KunnrDesc,
						oResultados.Matnr,
						oResultados.MatnrDesc,
						oResultados.Lfimg,
						oResultados.Vrkme,
						//(oResultados.Wadat) ? Despachoformatter.dateFormat(oResultados.Wadat) : "",
						(oResultados.Wadat) ? oResultados.Wadat : "",
						oResultados.Werks,
						oResultados.WerksDesc,
					]));
				}

				return aDatos3wn;

			},
			_agregarLineaHojaExcel: function (pvTipoLinea, paDatos) {
				return {
					Tipo: pvTipoLinea,
					Datos: paDatos
				};
			},

			_agregarPaginaLibroExcel: function (poLibro, poDatos, pvNombrePagina) {
				var oPagina = this._sheetFromArrayOfArrays(poDatos);
				var wscols = [];
				var objectMaxLength = [];
				//Calcular ancho de las columnas
				for (var i = 0; i < poDatos.length; i++) {
					var value = Object.values(poDatos[i].Datos);
					for (var j = 0; j < value.length; j++) {

						if (value[j]) {
							objectMaxLength[j] = objectMaxLength[j] >= value[j].toString().length ? objectMaxLength[j] : value[j].toString().length;
						}
					}
				}
				//Setear ancho de las columnas
				for (var k = 0; k < objectMaxLength.length; k++) {
					wscols.push({
						wch: objectMaxLength[k]
					});
				}
				oPagina['!cols'] = wscols;
				poLibro.SheetNames.push(pvNombrePagina);
				poLibro.Sheets[pvNombrePagina] = oPagina;
			},

			_generarExcel: function (poLibro, pvNombreArchivo) {

				var wbout = XLSX.write(poLibro, {
					bookType: "xlsx",
					type: "binary"
				});

				//Generar la descarga
				function s2ab(s) {
					var buf = new ArrayBuffer(s.length);
					var view = new Uint8Array(buf);
					for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
					return buf;
				}

				saveAs(new Blob([s2ab(wbout)], {
					type: "application/octet-stream"
				}), pvNombreArchivo + ".xlsx");

			},

			_sheetFromArrayOfArrays: function (aData) {
				debugger;
				var ws = {};
				var range = {
					s: {
						c: 10000000,
						r: 10000000
					},
					e: {
						c: 0,
						r: 0
					}
				};
				//Recorrer filas
				for (var R = 0; R != aData.length; ++R) {
					var vTipoLinea = aData[R].Tipo;
					//Recorrer columnas
					for (var C = 0; C != aData[R].Datos.length; ++C) {
						var vValor = aData[R].Datos[C];
						if (range.s.r > R) range.s.r = R;
						if (range.s.c > C) range.s.c = C;
						if (range.e.r < R) range.e.r = R;
						if (range.e.c < C) range.e.c = C;
						var cell = {
							v: vValor
						};
						//if (cell.v == null) continue;
						var cell_ref = XLSX.utils.encode_cell({
							c: C,
							r: R
						});

						if (typeof cell.v === 'number') cell.t = 'n';
						else if (typeof cell.v === 'boolean') cell.t = 'b';
						else if (cell.v instanceof Date) {
							cell.t = 'n';
							cell.z = XLSX.SSF._table[14];
							cell.v = datenum(cell.v);
						} else cell.t = 's';
						cell.s = {};
						var vBorderLeft = false;
						var vBorderRight = false;
						if (C === 0) { //Primera columna
							vBorderLeft = true;
						} else if (C === aData[R].Datos.length - 1) { //Última columna
							vBorderRight = true;
						}
						ws[cell_ref] = cell;
					}
				}
				if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
				return ws;
			},

			// HISTORICOS
			onOpenHistoricos: function (oEvent) {
				debugger;
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("RouteHistoricos", {
					vbeln: "",
					printPdf: ""
				})
			},

			onSortPark: function () {
				debugger;
				this.getViewSettingsDialog("ar.com.rizobacter.despacho.view.fragment.SortPopover")
					.then(function (oViewSettingsDialog) {
						oViewSettingsDialog.open();
					});
			},

			getViewSettingsDialog: function (sDialogFragmentName) {
				var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

				if (!pDialog) {
					pDialog = Fragment.load({
						id: this.getView().getId(),
						name: sDialogFragmentName,
						controller: this
					}).then(function (oDialog) {
						if (Device.system.desktop) {
							oDialog.addStyleClass("sapUiSizeCompact");
						}
						return oDialog;
					});
					this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
				}
				return pDialog;
			},

			handleSortDialogConfirm: function (oEvent) {
				debugger;
				var oTable = this.byId("tablaEntregas"),
					mParams = oEvent.getParameters(),
					oBinding = oTable.getBinding("items"),
					sPath,
					bDescending,
					aSorters = [];

				sPath = mParams.sortItem.getKey();
				bDescending = mParams.sortDescending;
				aSorters.push(new Sorter(sPath, bDescending));

				oBinding.sort(aSorters);
			},

			_onPrintRemito: function (nro_doc) {
				debugger;
				var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
				let opdfViewer = new PDFViewer();
				this.getView().addDependent(opdfViewer);
				let sServiceURL = this.getView().getModel("entregas").sServiceUrl;
				let sSource = sServiceURL + "/EntregaSet('" + nro_doc + "')/$value";
				opdfViewer.setSource(sSource);
				opdfViewer.setTitle(oResourceBundle.getText("textos.globales.printPDF", [nro_doc]));
				opdfViewer.open();

			},

		});
	});