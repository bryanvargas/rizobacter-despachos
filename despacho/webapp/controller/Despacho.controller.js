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

		return BaseController.extend("ar.com.rizobacter.despacho.controller.Despacho", {
			formatter: Despachoformatter,
			onInit: function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

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

			onFilterVbeln: function (oEvent) {
				debugger;
				const aFilter = [];
				const sQuery = oEvent.getParameter("query");

				if (sQuery) {
					aFilter.push(new Filter("Vbeln", FilterOperator.Contains, sQuery));
				}

				const oList = this.getView().byId("table");
				const oBinding = oList.getBinding('items');
				oBinding.filter(aFilter);
			},

			_filter: function () {
				var oFilter = null;

				if (this._oGlobalFilter && this._oPriceFilter) {
					oFilter = new Filter([this._oGlobalFilter, this._oPriceFilter], true);
				} else if (this._oGlobalFilter) {
					oFilter = this._oGlobalFilter;
				} else if (this._oPriceFilter) {
					oFilter = this._oPriceFilter;
				}

				this.byId("table").getBinding('items').filter(oFilter, "Application");
			},

			filterGlobally: function (oEvent) {
				var sQuery = oEvent.getParameter("query");
				this._oGlobalFilter = null;

				if (sQuery) {
					this._oGlobalFilter = new Filter([
						new Filter("Vbeln", FilterOperator.Contains, sQuery),
						new Filter("NameWe", FilterOperator.Contains, sQuery),
						new Filter("Matnr", FilterOperator.Contains, sQuery),
						new Filter("Arktx", FilterOperator.Contains, sQuery),
						new Filter("Wadat", FilterOperator.Contains, sQuery),
						new Filter("Vrkme", FilterOperator.Contains, sQuery),
						new Filter("Werks", FilterOperator.Contains, sQuery)
					], false);
				}

				this._filter();
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

			_updateListItemCount: function (iTotalItems) {
				var sTitle;
				debugger;
				// only update the counter if the length is final
				if (this._oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("infoViaticos", [iTotalItems]);
					this.oViewModel.setProperty("/worklistTableTitle", sTitle);
				}
			},

			onAddLine: function (oEvent) {
				debugger;
				// var isonPressed = oEvent.getSource();

				// if (!this._oDialogDespacho) {
				// 	this._oDialogDespacho = sap.ui.xmlfragment("com.rizobacter.despacho.fragment.DialogDespacho", this);

				// 	this.getView().addDependent(this._oDialogDespacho);
				// };

				// this._oDialogDespacho.open();



				// create dialog lazily
				var oView = this.getView();

				if (!this.byId("mainDialog")) {
					Fragment.load({
						Id: oView.getId(),
						name: "com.rizobacter.despacho.fragment.DialogDespacho"
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						oDialog.open();
					});

				} else {
					this.byId("mainDialog").open();
				}
				// }
				// this.oMPDialog.then(function (oDialog) {
				// 	this.oDialog = oDialog;
				// 	this.oDialog.open();
				// 	this._oMessageManager.registerObject(this.oView.byId("formContainer"), true);

				// 	MessageToast.show('Press "Save" to trigger validation.');
				// 	this.createMessagePopover();
				// }.bind(this));
			},

			onOpenDialogRemito: function (oEvent) {
				debugger;
				var oItem= this.getView().byId("table").getSelectedItem();
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

			onClose: function() {
				this.byId("impRemitoDialog").close();
			},

			onEdit: function(oEvent) {
				//we are geting the particular row object() or property
				var selectedItems = oEvent.getSource().getBindingContext("bindData").getObject();
				//sending the path to update function so we know what is the row and we will bind see in update function()
				this._listdata = oEvent.getSource().getBindingContext("bindData").getPath().split("/")[2];
				var id = selectedItems.Id;
				var name = selectedItems.Name;
				var desig = selectedItems.Designation;
				var number = selectedItems.Number;
				var exp = selectedItems.Experience;
	
				if (!this.editDalog) {
					this.editDalog = sap.ui.xmlfragment(this.getView().getId(), "com.columnT_TableRowsEdit.view.edit", this);
					this.getView().addDependent(this.editDalog);
				}
				//set the value in fragment what we are getting from Object()
				this.getView().byId("idEmp").setValue(id);
				this.getView().byId("idName").setValue(name);
				this.getView().byId("idDesignation").setValue(desig);
				this.getView().byId("idNumber").setValue(number);
				this.getView().byId("idExperience").setValue(exp);
				this.editDalog.open();
	
			},

		});
	});