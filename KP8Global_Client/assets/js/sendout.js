var _charges, _maxAmountLimit;

function prePaymentDisclosure_bindings() {
    _charges = 0;
    currencyOnly();
    ui_msg(true, "Retrieving rates information...")
    $.ajax({
        url: '/prePaymentDisclosure',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        cache: false,
        success: function (res) {
            setTimeout(function() {
                if (res.code == 1 ) {
                    document.getElementById("address"   ).innerHTML = res.data.address;
                    document.getElementById("date"      ).innerHTML = 'Date : ' + res.data.date;
                    document.getElementById("charges"       ).value = 0;
                    document.getElementById("transferTaxes" ).value = '0.00';
                    document.getElementById("exchangeRate"  ).value = parseFloat(res.data.exchangeRate).toFixed(2);

                    _charges = res.data.charge;
                    _maxAmountLimit = res.data.maxAmountLimit;
                    
                    ui_msg();
                }
                else if (res.code == 1 ) {
                    ui_msg(true, res.message, true, 'Got it!', res.errorCode);
                    closeModule()
                }
                else {
                    ui_msg(true, 'Something is wrong,\n Please try again later...', true, 'Got it!', res.errorCode);
                    closeModule()
                }
            }, 1500);
        },
        error: function (err) {
            setTimeout(function(){
                ui_msg(true, 'Something is wrong,\n Please try again later...', true, 'Okay', 'E_SERVER_CONNECTION');
                closeModule()
                console.log(err);
            }, 3500);
        }
    });

    $('#transferAmount').on('keyup', function (e) {
                    
            var currentCharge = 0;
            var amount = parseFloat(document.getElementById("transferAmount").value).toFixed(2);
            if (amount > _maxAmountLimit) {
                ui_msg(true, "Max amount limit is " + _maxAmountLimit + " only", true, "Got it");
                if (amount > 99999)
                    document.getElementById("transferAmount").value = 0;
                else
                    document.getElementById("transferAmount").value = document.getElementById("transferAmount").value.toString().slice(0, -1);
            }
            for(var i = 0; i < _charges.length && currentCharge == 0; i++ ) {
                currentCharge = (amount >= _charges[i].minAmount && amount <= _charges[i].maxAmount ? _charges[i].charge : 0);
            }
            document.getElementById("charges").value = currentCharge;

            var transferAmount = parseFloat(document.getElementById("transferAmount").value)
            var charge         = parseFloat(document.getElementById("charges"       ).value).toFixed(2);
            var transferTax    = parseFloat(document.getElementById("transferTaxes" ).value)
            var exChangeRate   = parseFloat(document.getElementById("exchangeRate"  ).value).toFixed(2);
            
            var totalAmount    = formatNumber(parseFloat(transferAmount + charge + transferTax).toFixed(2));
            var benef          = formatNumber(parseFloat(transferAmount * exChangeRate).toFixed(2));

            document.getElementById("charges"    ).value = charge;
            document.getElementById("totalAmount").value = totalAmount;
            document.getElementById("benef"      ).value = benef;
            
            $('#prePaymentDisclosure-container button.bg_color.confirm').attr('disabled',amount > 0? false: true);
            
    }).on('focusout', function (e){
        document.getElementById("transferAmount").value = formatNumber(parseFloat(document.getElementById("transferAmount").value).toFixed(2));
    }).on('focusin', function (e){
        document.getElementById("transferAmount").value = document.getElementById("transferAmount").value.split(',').join('');
        this.select();
    });
}
function formatNumber(number){
    console.log(number);
    if (number > 999)
    {
        var temp = number.toString().split('.')
          , temp2 = temp[0].split('').reverse()
          , formattedNumber = "";
        for (var i=0; i < temp2.length; i++){
            if(i==3 || i == 6)
                formattedNumber += ',';
            formattedNumber += temp2[i]
            console.log(formattedNumber)
        }
        console.log(formattedNumber.split('').reverse().join('') + '.' + temp[1]);
        number = formattedNumber.split('').reverse().join('') + '.' + temp[1]
    }
    return number;
}
function btnPrintPDF() {
    document.getElementById("prnt_transferAmount").innerText = document.getElementById("transferAmount").value
    document.getElementById("prnt_charges"       ).innerText = document.getElementById("charges").value
    document.getElementById("prnt_transferTaxes" ).innerText = document.getElementById("transferTaxes").value
    document.getElementById("prnt_totalAmount"   ).innerText = document.getElementById("totalAmount").value
    document.getElementById("prnt_exchangeRate"  ).innerText = document.getElementById("exchangeRate").value
    document.getElementById("prnt_benef"         ).innerText = document.getElementById("benef").value
    $('div#ppd_printable').attr('style', '');
    window.print();
    $('div#ppd_printable').attr('style', 'display: none;');
}

function sendout_bindings() {
    ui_msg();
}