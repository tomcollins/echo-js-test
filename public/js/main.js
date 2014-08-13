requirejs.config({
    paths: {
        jquery:     '/js/vendor/jquery/jquery.min',
        echo:       '/js/vendor/echo/echo'
    }
});

require(['jquery', 'echo'], function($, Echo) {

    Echo.Debug.enable();

    var conf = { };
    conf[Echo.ConfigKeys.ECHO.TRACE] = 'EchoJSAVTesting';
    //conf[Echo.ConfigKeys.COMSCORE.URL] = 'http://sa.bbc.co.uk/bbc/test/s';
    conf[Echo.ConfigKeys.COMSCORE.URL] = 'http://d.bbc.co.uk/echochamber/comscore';
    conf[Echo.ConfigKeys.RUM.URL] = 'http://d.bbc.co.uk/echochamber/rum';

    var echoClient = new Echo.EchoClient('EchoJSAVTest', Echo.Enums.ApplicationType.WEB, conf);

    var eventHandlers = {
        userAction: function(counterName, labels) {
            echoClient.viewEvent(counterName, labels);
        }
    };

    $('#userActionsSend').on('click', function(e){
        var countername, labels;
        countername = $('#userActionCounterName').val();
        try {
            labels = JSON.parse($('#userActionLabels').val());
        } catch(e) {
            console.log('Error parsing JSON', e);
        }
        eventHandlers.userAction(countername, labels);
    });
});

