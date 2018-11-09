function ui_msg(isActive, msgActive, isManualClose, msgClose, errorCode, redirect_url) {
    if (isActive) {
        document.getElementById('ajxMsgr-msg').innerText = typeof msgActive == 'string' ? msgActive : 'Please wait...';

        if (isManualClose) {
            document.getElementById('ajxMsgr-btn').innerText = typeof msgClose == 'string' ? msgClose : 'Close';
            if ($('#ajxMsgr-btn').hasClass('_ajxMsgr-btn-hide')) {
                $('#ajxMsgr-btn').addClass('_ajxMsgr-btn-show');
                $('#ajxMsgr-btn').removeClass('_ajxMsgr-btn-hide');
            }
            if (redirect_url) {
                $('#ajxMsgr-btn').on('click', function() { window.location.href = redirect_url; } )
            }
        }
        
        document.getElementById('ajxErrCode').innerText = typeof errorCode == 'string' ? errorCode : '';

        $('div._ajxMsgr-uiBlocker').addClass('_ajxMsgr-uiBlocker-show');
        $('div._ajxMsgr-uiBlocker').removeClass('_ajxMsgr-uiBlocker-hide');
        setTimeout(function () {
            $('div._ajxMsgr-controller').addClass('_ajxMsgr-controller-show');
            $('div._ajxMsgr-controller').removeClass('_ajxMsgr-controller-hide');
            setTimeout(function () {
                $('div._ajxMsgr-container').addClass('_ajxMsgr-container-show');
                $('div._ajxMsgr-container').removeClass('_ajxMsgr-container-hide');
                
                $('#ajxMsgr-btn').focus();
            }, 600);
        },300);
    }
    else {
        $('div._ajxMsgr-container').removeClass('_ajxMsgr-container-show');
        $('div._ajxMsgr-container').addClass('_ajxMsgr-container-hide');
        setTimeout(function () {
            $('div._ajxMsgr-controller').removeClass('_ajxMsgr-controller-show');
            $('div._ajxMsgr-controller').addClass('_ajxMsgr-controller-hide');
            setTimeout(function () {
                $('div._ajxMsgr-uiBlocker').removeClass('_ajxMsgr-uiBlocker-show');
                $('div._ajxMsgr-uiBlocker').addClass('_ajxMsgr-uiBlocker-hide');
                setTimeout(function () {
                    if ($('#ajxMsgr-btn').hasClass('_ajxMsgr-btn-show')) {
                        $('#ajxMsgr-btn').addClass('_ajxMsgr-btn-hide');
                        $('#ajxMsgr-btn').removeClass('_ajxMsgr-btn-show');
                    }
                }, 100);
            },500);
        }, 500);
    }
}