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

        return BaseController.extend("ar.com.rizobacter.despacho.controller.Historicos", {
			formatter: Despachoformatter,
            /**
             * @override
             * 
             */
            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteHistoricos").attachPatternMatched(this._onObjectMatch, this);
                this._oTextos = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._oGlobalBusyDialog = new sap.m.BusyDialog();
                this._mViewSettingsDialogs = {};
                this._getHistorico();
                this._filtersModel();

				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("tablaHistoricos");

				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();

				oViewModel = new JSONModel({
					worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [window.location.href]),
					tableBusyDelay: 0
				});
				this.setModel(oViewModel, "worklistView");

				oTable.attachEventOnce("updateFinished", function () {
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});





            },

            _onObjectMatch: function (oEvent) {
                var that = this;
				this.getView().setBusy(true);		
                this.getView().getModel("entregas").read("/EntHistSet", {
                    success: function (odata) {
                        debugger;
                        var jModel = new sap.ui.model.json.JSONModel(odata);
                        that.getView().byId("tablaHistoricos").setModel(jModel);
						that.getView().setBusy(false);		
                    }, error: function (oError) {
						that.getView().setBusy(false);		
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
                                template: new sap.m.StandardListItem({
                                    title: '{materiales>Descripcion}',
                                    description: '{materiales>Material}'
                                })
                            });
                            that._oValueHelpDialog._Field = "matnr";
                            break;


                    }
                    oDialog.open(sInputValue);

                    return oDialog;
                });

            },
            onValueHelpSearch: function (oEvent) {
                debugger;
                var sValue = oEvent.getParameter("value");

                if (this._oValueHelpDialog._Field === "matnr") {
                    oEvent.getSource().getBinding("items").filter([
                        new Filter("Material", FilterOperator.Contains, sValue)
                    ]);
                }

                if (this._oValueHelpDialog._Field === "kunnr") {
                    oEvent.getSource().getBinding("items").filter([
                        new Filter("Kunnr", FilterOperator.Contains, sValue)
                    ]);
                }
            },

            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                this._kunnrDialogInput.setValue(oSelectedItem.getTitle());
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

            _filtersModel: function () {
				let oModel = {
					Vbeln: ""
				};
				this.getView().setModel(new JSONModel(oModel), "filters");
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

            onFilterHistorico: function (oEvent) {
                debugger;
                const aFilter = [];
                var that = this;

                let oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "YYYYMMdd"
                }),

                    kunnr = that.byId("kunnrInput").getValue(),
                    matnr = that.byId("matnrInput").getValue(),
                    wadatIst = that.byId("wadatIstInput").getValue(),
                    oDate = oDateFormat.format(oDateFormat.parse(wadatIst)),

					
					dateIn = oDateFormat.format(oDateFormat.parse(wadatIst.split('-')[0].trim())),
					dateOut = oDateFormat.format(oDateFormat.parse(wadatIst.split('-')[1].trim()));

                if (kunnr !== "") {
                    aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
                };

                if (matnr !== "") {
                    aFilter.push(new Filter("Matnr", sap.ui.model.FilterOperator.EQ, matnr));
                };

                if (wadatIst !== "") {
                    aFilter.push(new Filter("WadatIst", sap.ui.model.FilterOperator.BT, dateIn, dateOut));
                };

                if (kunnr !== "" && matnr !== "" && wadatIst !== "") {
                    aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
                    aFilter.push(new Filter("Matnr", sap.ui.model.FilterOperator.EQ, matnr));
                    aFilter.push(new Filter("WadatIst", sap.ui.model.FilterOperator.EQ, oDate));
                };

                if (kunnr !== "" && matnr !== "") {
                    aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
                    aFilter.push(new Filter("Matnr", sap.ui.model.FilterOperator.EQ, matnr));
                };

                if (kunnr !== "" && wadatIst !== "") {
                    aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
                    aFilter.push(new Filter("WadatIst", sap.ui.model.FilterOperator.EQ, oDate));

                };

                if (matnr !== "" && wadatIst !== "") {
                    aFilter.push(new Filter("Kunnr", sap.ui.model.FilterOperator.EQ, kunnr));
                    aFilter.push(new Filter("WadatIst", sap.ui.model.FilterOperator.EQ, oDate));
                };

                this.getView().getModel("entregas").read("/EntHistSet", {
                    filters: [aFilter],
                    success: function (odata) {
                        var jModel = new sap.ui.model.json.JSONModel(odata);
                        that.getView().byId("tablaHistoricos").setModel(jModel);
                    }, error: function (oError) {
                        debugger;
                        that.getView().byId("tablaHistoricos").setModel(models.histoModel());
                    }.bind(that)
                })
            },
            onClearFilterHistorico: function () {
                var that = this;
                that.byId("kunnrInput").setValue("");
                that.byId("matnrInput").setValue("");
                that.byId("wadatIstInput").setValue("");
                this._getHistorico();
            },

            _getHistorico: function () {
				debugger;
                this.getOwnerComponent().getModel("entregas").read("/EntHistSet", {
                    success: function (odata) {
                        this.getView().setBusy(false);
                        var jModel = new sap.ui.model.json.JSONModel(odata);
                        this.getView().byId("tablaHistoricos").setModel(jModel);
                    }.bind(this),
                    error: function (oError) {
                        console.log(oError)
                    }.bind(this)
                });
            },

            onPrintRemito: function () {
                debugger;
                var oItem = this.getView().byId("tablaHistoricos").getSelectedItem();
                
                if (oItem !== null) {
					let vbeln = oItem.getBindingContext().getObject().Vbeln;
                    let opdfViewer = new PDFViewer();
                    this.getView().addDependent(opdfViewer);
                    let sServiceURL = this.getView().getModel("entregas").sServiceUrl;
                    let sSource = sServiceURL + "/EntregaSet('" + vbeln + "')/$value";
				   opdfViewer.setSource(sSource);
				   opdfViewer.setTitle(this._oTextos.getText("textos.globales.printPDF", [vbeln]));
				   opdfViewer.open();
                    debugger;
                } else {
					MessageToast.show('Seleccione una entrega');
				};
            },
            onSearch: function (oEvent) {
                debugger;
                const oViewModel = this.getView().getModel("filters");
                const oTablaEntregas = this.getView().byId("tablaHistoricos");
                const oBinding = oTablaEntregas.getBinding("items");

                let oFilters = [];

                if (oViewModel.getProperty("/Vbeln")) {
                    oFilters.push(new Filter("Vbeln", FilterOperator.Contains, oViewModel.getProperty("/Vbeln")));
                };

                oBinding.filter(oFilters);
            },

            _filtersModel: function () {
                let oModel = {
                    Vbeln: ""
                };
                this.getView().setModel(new JSONModel(oModel), "filters");
            },

            
			onSortPark: function () {
				debugger;
				this.getViewSettingsDialog("ar.com.rizobacter.despacho.view.fragment.SortPopoverHist")
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

            onExportxlsEntregas: function (oEvent) {
				if (this.getView().byId("tablaHistoricos").getItems().length > 0) {

					this._oGlobalBusyDialog.setText("DescargandoInformacion");
					this._oGlobalBusyDialog.open();
					var oLibro = this._crearLibroExcel();
					var oDatosResultados = this._armarDatos3WMParkeadas(); 
					this._agregarPaginaLibroExcel(oLibro, oDatosResultados, "Historico");

					var filename = "Reporte Despachos - Historico " + new Date().toDateString();

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

				var oTablaPrecargados = this.getView().byId("tablaHistoricos");
				var aItems = oTablaPrecargados.getItems();
				var aDatos3wn = [];

				//Agregar encabezados columnas
				aDatos3wn.push(this._agregarLineaHojaExcel("", [
					this._oTextos.getText("entregas.historicos.vbeln"),
					this._oTextos.getText("entregas.historicos.xblnr"),
					this._oTextos.getText("entregas.historicos.kunnr"),
					this._oTextos.getText("entregas.historicos.kunnrDesc"),
					this._oTextos.getText("entregas.historicos.matnr"),
					this._oTextos.getText("entregas.historicos.matnrDesc"),
					this._oTextos.getText("entregas.historicos.charg"),
					this._oTextos.getText("entregas.historicos.lfimg"),
					this._oTextos.getText("entregas.historicos.vrkme"),                    
					this._oTextos.getText("entregas.historicos.werksDesc"),
                    this._oTextos.getText("entregas.historicos.wadatIst"),

				]));

				//Agregar solo postulaciones seleccionadas
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

						oResultados.Xblnr,
						oResultados.Kunnr,
						oResultados.KunnrDesc,
						oResultados.Matnr,
						oResultados.MatnrDesc,
						oResultados.Charg,
						//(oResultados.Wadat) ? Despachoformatter.dateFormat(oResultados.Wadat) : "",
						oResultados.Lfimg,
						oResultados.Vrkme,
						oResultados.WerksDesc,
                        oResultados.WadatIst
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

			onUpdateFinished: function (oEvent) {
				debugger;
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				// only update the counter if the length is final and
				// the table is not empty
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("infoHistorico", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},
        });
    });   