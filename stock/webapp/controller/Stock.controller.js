sap.ui.define([
	'./BaseController',
	'sap/m/MessageToast',
	'sap/ui/core/Fragment',
	'sap/ui/model/json/JSONModel',
	"sap/m/PDFViewer",
	'../model/StockFormatter',
	'../model/models',
	"sap/ui/Device",
	"sap/ui/model/Sorter",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/comp/smartvariants/PersonalizableInfo'
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (BaseController, MessageToast, Fragment, JSONModel, PDFViewer, Stockformatter, models, Device, Sorter, Filter, FilterOperator, PersonalizableInfo) {
		'use strict';

		return BaseController.extend("ar.com.rizobacter.stock.controller.Stock", {
			formatter: Stockformatter,
			onInit: function () {
				this.oFilterBar = this.getView().byId("filterbar");
				this._oListStock = this.getView().byId("tablaStock")

				const oFiltrosStock = new sap.ui.model.json.JSONModel({
					Centro: "",
					Material: "",
					Almance: "",
					Lote: ""
				});


			this.fetchData = this.fetchData.bind(this);

			var oPersInfo = new PersonalizableInfo({
				type: "filterBar",
				keyName: "persistencyKey",
				dataSource: "",
				control: this.oFilterBar
			});
			this.oSmartVariantManagement = this.getView().byId("svm");
			this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
			this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);

				const oFiltrosCentro = new sap.ui.model.json.JSONModel({
					centros: [ {						
						centro: "",
						descripcion: ""
					}],
					materiales: [ {						
						material: "",
						descripcion: ""
					}],
					lotes: [ {						
						lote: "",
					}],
				});

				this._mViewSettingsDialogs = {};

				this.getView().setModel(oFiltrosStock, "oFiltrosStock");

				this.getView().setModel(oFiltrosCentro, "oFiltrosCentro");

				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("tablaStock");

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

				this._getStock();
				this._filtersModel();
				this._filtersListModel();
			},

			handleSelectionChange: function(oEvent) {
				debugger;
				var selectedItems = oEvent.getParameter("selectedItems");
				var changedItem = oEvent.getParameter("changedItem");
				var isSelected = oEvent.getParameter("selected");
	
				var state = "Selected";
				if (!isSelected) {
					state = "Deselected";
				}
	
				MessageToast.show("Event 'selectionChange': " + state + " '" + changedItem.getText() + "'", {
					width: "auto"
				});
			},

			onFilterStock: function (oEvent) {
				debugger;
				const aFilter = [];
				var that = this;
				var almacen = that.byId("almacenInput").getValue();

				if (almacen !== "") {
					aFilter.push(new Filter("Almacen", sap.ui.model.FilterOperator.EQ, almacen));
				};


				this.getView().getModel("stock").read("/ZCDS_GETSTOCK", {
					filters: [aFilter],
					success: function (odata) {
						var jModel = new sap.ui.model.json.JSONModel(odata);
						that.getView().byId("tablaStock").setModel(jModel);
					}, error: function (oError) {
						debugger;
						that.getView().byId("tablaStock").setModel(models.entCabModel());
					}.bind(that)
				})
			},

			onCleanFilterStock: function () {
				var that = this;
				if (that.byId("almacenInput").getValue() !== "") {
					that.byId("almacenInput").setValue("");
					this._getStock();
				}
			},

			onSearching: function (oEvent) {
				debugger;
				const oViewModel = this.getView().getModel("filters");
				const oTablaEntregas = this.getView().byId("tablaStock");
				const oBinding = oTablaEntregas.getBinding("items");

				oBinding.filter([new sap.ui.model.Filter([
					new sap.ui.model.Filter("Centro", sap.ui.model.FilterOperator.Contains, oViewModel.getProperty("/Centro")),
					new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, oViewModel.getProperty("/Centro")),
					new sap.ui.model.Filter("Lote", sap.ui.model.FilterOperator.Contains, oViewModel.getProperty("/Centro")),
					new sap.ui.model.Filter("Almacen", sap.ui.model.FilterOperator.Contains, oViewModel.getProperty("/Centro")),
					new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, oViewModel.getProperty("/Centro"))
				], false)]);
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
					sTitle = this.getResourceBundle().getText("infoStock", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},

			onExportxlsStock: function (oEvent) {
				if (this.getView().byId("tablaStock").getItems().length > 0) {

					this._oGlobalBusyDialog.setText("Descargando Informacion");
					this._oGlobalBusyDialog.open();
					var oLibro = this._crearLibroExcel();
					var oDatosResultados = this._armarDatos3WMParkeadas();
					this._agregarPaginaLibroExcel(oLibro, oDatosResultados, "Stock");

					var filename = "Reporte Stock" + new Date().toDateString();

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

				var oTablaPrecargados = this.getView().byId("tablaStock");
				var aItems = oTablaPrecargados.getItems();
				var aDatos3wn = [];

				//Agregar encabezados columnas
				aDatos3wn.push(this._agregarLineaHojaExcel("", [
					this._oTextos.getText("stock.centro"),
					this._oTextos.getText("stock.material"),
					this._oTextos.getText("stock.almacen"),
					this._oTextos.getText("stock.lote"),
					this._oTextos.getText("stock.loteDesc"),
					this._oTextos.getText("stock.umb"),
					this._oTextos.getText("stock.stockLibre"),
					this._oTextos.getText("stock.stockInspe"),
					this._oTextos.getText("stock.stockNolib"),
					this._oTextos.getText("stock.stockBloq"),
					this._oTextos.getText("stock.centroDesc"),
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
							sEstadoDescrip = "Error en Stock";
							break;
						case "03":
							sEstadoDescrip = "Stock cabecera";
							break;
						case "04":
							sEstadoDescrip = "Stock completo con error";
							break;
						case "05":
							sEstadoDescrip = "Stock completo OK";
							break;
						case "06":
							sEstadoDescrip = "Error de Stock";
							break;
						case "07":
							sEstadoDescrip = "Stock";
							break;
					}

					aDatos3wn.push(this._agregarLineaHojaExcel("", [
						oResultados.Centro,

						oResultados.Material,
						oResultados.Almacen,
						oResultados.Lote,
						oResultados.Descripcion,
						oResultados.UMB,
						oResultados.StockLibre,
						oResultados.StockInspe,
						oResultados.StockNoLib,
						oResultados.StockBloq,
						oResultados.CentroDesc,
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

			_filtersModel: function () {
				let oModel = {
					Centro: "",
					Material: "",
					Almance: "",
					Lote: ""
				};
				this.getView().setModel(new JSONModel(oModel), "filters");
			},

			onSortStock: function () {
				debugger;
				this.getViewSettingsDialog("ar.com.rizobacter.stock.view.fragment.SortPopover")
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
				var oTable = this.byId("tablaStock"),
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

			_getStock: function () {
				debugger;
				this.getView().setBusy(true);
				this.getOwnerComponent().getModel("filtrosModel").read("/GetFiltrosUsuario", {
					urlParameters:{
						'Usuario': "'" + this.getOwnerComponent().SapUser + "'"
					},					
					success: function (oData) {
						debugger;

						//var jModel = new sap.ui.model.json.JSONModel(oData);
						//sap.ui.getCore().setModel(jModel, "centros");

						var oFilters = [];

						if (oData.Almacen !== "") {
							oFilters = new Filter("Almacen", FilterOperator.EQ, oData.Almacen);
						}

						if (oData.Centro !== "") {
							oData.Centro.split(",").forEach(function (item) {
								oFilters.push(new Filter("Centro", FilterOperator.EQ, item));						
							});
						}
						for (var centro in oData.results) {
							debugger;
							console.log(oData.results);
						}
						this.getView().setBusy(true);

						this.getOwnerComponent().getModel("stock").read("/ZCDS_GETSTOCK", {	
							filters: oFilters,
							success: function (odata) {
								debugger;
								var ofilterCentros = odata.results.filter(function({Centro, CentroDesc}) {
									var key = `${Centro}${CentroDesc}`;
									return !this.has(key) && this.add(key);
								}, new Set);
								
								var ofilterMaterial = odata.results.filter(function({Material, Descripcion}) {
									var key = `${Material}${Descripcion}`;
									return !this.has(key) && this.add(key);
								}, new Set);
								
								var ofilterLotes = odata.results.filter(function({Lote}) {
									var key = `${Lote}`;
									return !this.has(key) && this.add(key);
								}, new Set);
								
								
				                 this.getView().getModel("oFiltrosCentro").setSizeLimit(50000);
				           		 var aRegistros = this.getView().getModel("oFiltrosCentro").getData();

								ofilterCentros.forEach(function (item) {
									aRegistros.centros.push({centro: item.Centro, descripcion: item.CentroDesc})						
								});

								ofilterMaterial.forEach(function (item) {
									aRegistros.materiales.push({material: item.Material, descripcion: item.Descripcion})					
								});

								ofilterLotes.forEach(function (item) {
									aRegistros.lotes.push({lote: item.Lote})					
								});

								this.getView().getModel("oFiltrosCentro").refresh();
								
								
								this.getView().setBusy(false);
								var jModel = new sap.ui.model.json.JSONModel(odata);
								this.getView().byId("tablaStock").setModel(jModel);
							}.bind(this),
							error: function (oError) {
								console.log(oError)
								this.getView().setBusy(false);
							}.bind(this)
						});

					}.bind(this),
					error: function (oError) {
						console.log(oError)
						this.getView().setBusy(false);
					}.bind(this)
				});
			},

			_filtersListModel: function () {
				let oModel = {
					Almacen: "",
					Centro: "",
					Lote: ""
				};

				this.getView().setModel(new JSONModel(oModel), "filters");
			},

			onFilterChange: function () {
				debugger;
				this._oListStock.setShowOverlay(true);
			},

			onSearch: function () {
				debugger;
				var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
					var oControl = oFilterGroupItem.getControl(),
						aSelectedKeys = oControl.getSelectedKeys(),
						aFilters = aSelectedKeys.map(function (sSelectedKey) {
							return new Filter({
								path: oFilterGroupItem.getName(),
								operator: FilterOperator.Contains,
								value1: sSelectedKey
							});
						});
	
					if (aSelectedKeys.length > 0) {
						aResult.push(new Filter({
							filters: aFilters,
							and: false
						}));
					}
	
					return aResult;
				}, []);
	
				this._oListStock.getBinding("items").filter(aTableFilters);
				this._oListStock.setShowOverlay(false);
			},		
			
			onSelectionChange: function (oEvent) {
				this.oSmartVariantManagement.currentVariantSetModified(true);
				this.oFilterBar.fireFilterChange(oEvent);
			},

			onExit: function() {
				this.oModel = null;
				this.oSmartVariantManagement = null;
				this.oExpandedLabel = null;
				this.oSnappedLabel = null;
				this.oFilterBar = null;
				this.oTable = null;
			},
	
			fetchData: function () {
				var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
					aResult.push({
						groupName: oFilterItem.getGroupName(),
						fieldName: oFilterItem.getName(),
						fieldData: oFilterItem.getControl().getSelectedKeys()
					});
	
					return aResult;
				}, []);
	
				return aData;
			},
		});
	});
