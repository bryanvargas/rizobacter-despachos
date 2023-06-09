//@ts-nocheck
sap.ui.define([],

    function () {
        return {
            statusFormatter: function (iStat) {
                var stat = "";
                if (!iStat) {
                    return "";
                }
                switch (iStat) {
                case "00":
                    stat = "sap-icon://to-be-reviewed";
                    break;
                case "01":
                    stat = "sap-icon://error";
                    break;
                case "02":
                    stat = "sap-icon://error";
                    break;
                case "03":
                    stat = "sap-icon://locked";
                    break;
                case "04":
                    stat = "sap-icon://error";
                    break;
                case "05":
                    stat = "sap-icon://locked";
                    break;
                case "06":
                    stat = "sap-icon://error";
                    break;
                case "07":
                    stat = "sap-icon://sys-enter";
                    break;
                case "08":
                    stat = "sap-icon://error";
                    break;
                case "09":
                    stat = "sap-icon://inspect-down";
                    break;
                    
                }
    
                return stat;
            },

            statColorFormater: function (iStatCol) {
                var stat = "";
                if (!iStatCol) {
                    return "Neutral";
                }
    
                switch (iStatCol) {
                case "00":
                    stat = "Neutral";
                    break;
                case "01":
                    stat = "Negative";
                    break;
                case "02":
                    stat = "Negative";
                    break;
                case "03":
                    stat = "Neutral";
                    break;
                case "04":
                    stat = "Negative";
                    break;
                case "05":
                    stat = "Neutral";
                    break;
                case "06":
                    stat = "Negative";
                    break;
                case "07":
                    stat = "Positive";
                    break;
                case "08":
                    stat = "Negative";
                    break;
                }
    
                return stat;
            },
            quitarCero: function (iNum) {
                if (!iNum) {
                    return "";
                }
                return parseInt(iNum, 0); 
            },


            dateFormat: function (iDate) {
                if (!iDate) {
                    return "";
                }    
                var anio = iDate.getFullYear();
                var mes = iDate.getUTCMonth();
                var dia = iDate.getUTCDate();
                return dia + "/" + mes + "/" + anio;
            },
    
        };
    });