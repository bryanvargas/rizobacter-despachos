sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device) {
        "use strict";


        var gEntCabModel = new JSONModel({
            "Vbeln": "",
            "Kunnr": "",
            "KunnrDesc": "",
            "Matnr": "",
            "MatnrDesc": "", 
            "Lfimg": "",
            "Vrkme": "",
            "Wadat": "",
            "Werks": "",
            "WerksDesc": "",
        });

        var gHistoModel = new JSONModel({
            "Vbeln": "",
            "Xblnr": "",
            "Kunnr": "",
            "KunnrDesc": "",
            "Matnr": "", 
            "MatnrDesc": "",
            "Charg": "",
            "Lfimg": "",
            "Vrkme": "",
            "WerksDesc": "",
            "WadatIst": "",
        });


        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
        },
        createGlobalModel: function() {
            var oModel = new JSONModel();
            var oData = {};
            oModel.setData(oData);
            return oModel;
        },
        entCabModel: function() {
            return gEntCabModel;
        },
        histoModel: function() {
            return gHistoModel;
        },
    };
});