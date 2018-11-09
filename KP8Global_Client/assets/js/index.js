function bg_show() {
    setTimeout(function(){
        $('div.intro').addClass('mlbgShow');
        $('div.intro').removeClass('mlbgHide');

        setTimeout( function() {
            $('header').addClass('header_show');
            $('header').removeClass('header_hide');

            $('footer').addClass('footer-show');
            $('footer').removeClass('footer-hide');
        },1000);
    },500);
};

function bind_menu() {
    var recentlyClicked;
    $('header > ul > li > a').on('click', function () {
        if (!$(this.parentElement.lastElementChild).hasClass('show') && recentlyClicked != this)
        {
            $(this.parentElement.lastElementChild).addClass('show').focus();
            $(this).addClass('show');
            recentlyClicked = this;
        }
        else
            recentlyClicked = null;
    });
    $('header > ul > li > div').on('focusout', function () {
        $(this.parentElement.firstElementChild).removeClass('show');
        $(this).removeClass('show');
        if (recentlyClicked != null)
            setTimeout(function(){
                recentlyClicked = null;
            }, 250);
    });
    $('header > ul > li > div > ul > li > a').on('click', function () {
        if (this.id == 'logout') {
            ui_msg(true, "Logging Out", false, "");
            window.location.href = '/' + this.getAttribute('data-link');
        }
        else {
            ui_msg(true, "Opening\n" + $(this).text(), false, "");
            $('#menu-module-container').removeClass('show');
            var linkTo = this.getAttribute('data-link')
            $.ajax({
                url: '/' + linkTo,
                type: 'GET',
                contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                dataType: 'html',
                cache: false,
                success: function (res) {
                    setTimeout(function() {
                        document.getElementById('menu-module-container').innerHTML = res;
                        $('#menu-module-container').addClass('show');
                        default_bindings(linkTo);
                    }, 3500);
                },
                error: function (err) {
                    setTimeout(function(){
                        ui_msg(true, 'Something is wrong,\n Please try again later...', true, 'Got It', 'E_SERVER_CONNECTION');
                        document.getElementById('menu-module-container').innerHTML = "";
                        console.log(err);
                    }, 3500);
                }
            });
        }
        $(this.parentElement.parentElement.parentElement.parentElement.firstElementChild).removeClass('show');
        $(this.parentElement.parentElement.parentElement.parentElement.lastElementChild).removeClass('show');
    });
}

var idle_timer;
var idle_time = 5.1; //minutes
var enableTimer = false;

$(document).on('mouseover click keyup', function () {
    if (enableTimer) {
        clearTimeout(idle_timer);
        idle_timeStart(idle_time); /*number is minutes*/
    }
});

function idle_timesUp() {
    window.location.href = '/login';
}

function idle_timeStart(minute) {
    console.log('You will be logged out if inactive for ' + idle_time + ' minute/s...');
    idle_timer =  setTimeout(idle_timesUp, minute * 60/*seconds*/ * 1000/*miliseconds*/);
}

function start(greetUser) {
    ui_msg(true, "Welcome " + greetUser + "\n Please wait..."); 
    $.ajax({
        url: '/_menu',
        type: 'GET',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        dataType: 'html',
        cache: false,
        success: function (res) {
            document.getElementById('header').innerHTML = res;
            setTimeout(function(){
                ui_msg();
                setTimeout(function(){
                    bg_show(); 
                    bind_menu();
                    enableTimer = true;
                    idle_timeStart(idle_time);
                },200);
            }, 3500);
        },
        error: function (err) {
            ui_msg(true, 'Something is wrong,\n Please try again later...', false, '', 'E_SERVER_CONNECTION');
            console.log(err);
        }
    });
}

function default_bindings(linkTo){
    $('div.label') .on('click', function() {
        $(this.parentElement.lastElementChild.firstElementChild).focus();
    });
    $('.div-input > input').focusin(function (){
        $(this.parentElement.parentElement.firstElementChild).addClass('active');
        $(this.parentElement).addClass('active');
    }).focusout(function (){
        if (this.value == '') {
            $(this.parentElement.parentElement.firstElementChild).removeClass('active');
            $(this.parentElement).removeClass('active');
        }
    });

    $('#close, #cancel').click(function (){
        closeModule();
    })

    if (linkTo == 'changePassword')
        changePassword_bindings()
    else if (linkTo == 'prePaymentDisclosure')
        prePaymentDisclosure_bindings()
    else if (linkTo == 'sendout')
        sendout_bindings();
}

function changePassword_bindings(){
    ui_msg();
    $('form').on('submit', function(e){
        e.preventDefault();

        var _pw  = document.getElementsByName('passWord')[0].value
          , _np  = document.getElementsByName('newPassWord')[0].value
          , _cnp = document.getElementsByName('confirmNewPassWord')[0].value;

        if (_pw == '' || _np == '' || _cnp == '') {
            ui_msg(true, "All fields required."
                 , true, "Got it!", null, null);
        }
        else if (!password_validity(_np)) {
            ui_msg(true, "New password must be atleast 14 or more alphanumeric characters with upper and lowercase combination"
                 , true, "Try Again", null, null);
            $('input[name=confirmNewPassWord]').focus();
            document.getElementsByName('confirmNewPassWord')[0].value = '';
            $('input[name=newPassWord]').focus();
            document.getElementsByName('newPassWord')[0].value = '';
            $('input[name=passWord]').focus();
            document.getElementsByName('passWord')[0].value = '';
        }
        else if (_np != _cnp) {
            ui_msg(true, "New password mismatch"
                 , true, "Okay", null, null);
            $('input[name=confirmNewPassWord]').focus();
            document.getElementsByName('confirmNewPassWord')[0].value = '';
        }
        else {
            ui_msg(true, "Updating your password\nPlease Wait...");

            var inputs = $(this).serializeArray();
            var formObj = {};
    
            $.each(inputs, function (i, input) {
                formObj[input.name] = input.value;
            });

            $.ajax({
                url: '/' + this.getAttribute('action'),
                type: 'POST',
                data: JSON.stringify(formObj),
                contentType: 'application/json',
                dataType: 'json',
                cache: false,
                success: function (res) {
                    console.log(res);
                    setTimeout(function(){
                        if (res.code == 1) {
                            ui_msg(true, res.message, true, 'Confirmed', null, null)
                            $('#menu-module-container').removeClass('show');
                            setTimeout(function (){
                                document.getElementById('menu-module-container').innerHTML = '';
                            }, 1500)
                        }
                        else if (res.code == 0) {
                            ui_msg(true, res.message, true, 'Again', res.errorCode, null)
                        }
                        else
                            ui_msg(true, res.message, true, 'Got it', res.errorCode, res.errorCode == 'E_DB_CON' ? null : '/logout');
                    }, 3500);
                },
                error: function (err) {
                    ui_msg(true, 'Something is wrong,\n Please try again later...', true, 'Got it', 'E_SERVER_CONNECTION');
                    console.log(err);
                }
            });            
        }
    });
}

//password must be atleast 14 or more alphanumeric character with upper and lowercase combination
function password_validity(_password) {
    var password = _password.split('')
      , has_numeric = false
      , has_upperCase = false
      , has_lowerCase = false
      , returnResponse = false;

    if(_password.length >= 14) {
        for(var i = 0; i < password.length; i++) {

            if(!isNaN(password[i])) {
                has_numeric = true;
            }
            else if(password[i] == password[i].toUpperCase()) {
                has_upperCase = true;
            }
            else if(password[i] == password[i].toLowerCase()) {
                has_lowerCase = true;
            }

            if(has_upperCase && has_lowerCase && has_numeric) {
                i = password.length
                returnResponse = true;
            }
        }
    }
    return returnResponse;
}

function closeModule(){
    $('#menu-module-container').removeClass('show');
    setTimeout(function(){
        document.getElementById('menu-module-container').innerHTML = null;
    },500);
}