// PARAMETERS : methodParams  = Array of strings,
//              requestParams = req.body or req.query,
//              paramTypes    = Objects of { varParamName : String(dataType) (eg. 'string' or 'number' or 'boolean') }
var checkParameters = function (methodParams, requestParams, paramTypes)
{
    var rqParam =  Object.keys(requestParams);                            
    var matchCount = 0
      , isMatched = false
      , responmsg = ""
      , errorCode = null;
    
    if(methodParams.length == rqParam.length){
        // Checking required parameters
        for(var metParCount = 0; metParCount < methodParams.length; metParCount++)
        {   for(var reqParCount = 0; reqParCount < rqParam.length; reqParCount++){
                if(methodParams[metParCount] == rqParam[reqParCount])
                {   matchCount++;
                    reqParCount = rqParam.length;
                }
            }
        }

        // Checking parameter value type
        if(matchCount == methodParams.length) {
            var typeMatches = 0;
            for (var key in requestParams) {
                if (requestParams.hasOwnProperty(key)) {
                    var reqVal, parTyp;
                    reqVal = requestParams[key];
                    parTyp = paramTypes[key];
                    
                    if ((parTyp == 'number' && typeof(reqVal) != parTyp && isNaN(reqVal))
                       ||(parTyp == 'string' && typeof(reqVal) != parTyp)
                       ||(parTyp == 'boolean' &&  typeof(reqVal) != parTyp && !( reqVal == 'true' || reqVal == 'True' || reqVal == 'TRUE'
                                                                               || reqVal == 'false'|| reqVal == 'False'|| reqVal == 'FALSE')))
                        {
                        responmsg += "[" + key + "] is not a " + parTyp + "-- ";
                    }
                    else {
                        if (reqVal == undefined || reqVal == null || reqVal.length == 0) {
                            responmsg += "[" + key+ "] is undefined-- ";
                        }
                        else
                            typeMatches++;
                    }
                }
            }
            if (typeMatches == methodParams.length) {
                responmsg = 'request parameters matched';
                isMatched = true;
            }
        }
        else {
            responmsg = 'request parameter type mismatch';
            errorCode = 'E_PARA_TYPE';
        }
    }
    else {
        responmsg = 'request parameters mismatch - case sensitive';
        errorCode = 'E_PARA_MISMATCH';
    }
    console.log(responmsg);
    return { isMatch : isMatched, responmsg : responmsg, errorCode : errorCode };
};

var getRespMessage = function (code) {
    var msg;
    switch (code)
    {
        case  1: msg = "Success";
                  break;
        case  2: msg = "Duplicate kptn";
                  break;
        case  3: msg = "KPTN already claimed";
                  break;
        case  4: msg = "KPTN not found";
                  break;
        case  5: msg = "Customer not found";
                  break;
        case  6: msg = "Customer already exist";
                  break;
        case  7: msg = "Invalid credentials";
                  break;
        case  8: msg = "KPTN already cancelled";
                  break;
        case  9: msg = "Transaction is not yet claimed";
                  break;
        case 10: msg = "Version does not match";
                  break;
        case 11: msg = "Problem occured during saving. Please resave the transaction.";
                  break;
        case 12: msg = "Problem saving transaction. Please close the sendout form and open it again. Thank you.";
                  break;
        case 13: msg = "Invalid station number.";
                  break;
        case 14: msg = "Error generating receipt number.";
                  break;
        case 15: msg = "Unable to save transaction. Invalid amount provided.";
                  break;
        case 16: msg = "Branch does not exist in Branch Charges.";
                  break;
        case 17: msg = "This transaction is already beyond 3 months. Please call MIS-HELPDESK at 09479991948 for assistance. Thank you!";
                  break;
        default: msg = "SYSTEM_ERROR";
                  break;
    }
    return msg;
};

var getServerDate = function (kplog, connection, callback){
    connection.query('SELECT NOW() as serverdt',
    function (error, resultData) {
        connection.end();
        var returningValue = null;
        if (error) {
            kplog.fatal(error);            
        }
        else {
            returningValue = resultData[0].serverdt;
        }
        callback(error, returningValue);
    });
}

var methods = { checkParameters, getRespMessage, getServerDate };

module.exports = methods;