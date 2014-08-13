requirejs.config({
    paths: {
        jquery:     '/vendor/jquery/jquery.min',
        echo:       '/vendor/echo/echo'
    }
});

require(['jquery', 'echo'], function($, Echo) {

    Echo.Debug.enable();

    var currentMedia;
    var hasSentViewEvent = false;
    var hasSetMedia = false;
    var viewEventCount = 0;
    var userActionCount = 0;
    var setMediaCount = 0;

    var conf = { };
    conf[Echo.ConfigKeys.ECHO.TRACE] = 'EchoJSAVTesting';
    //conf[Echo.ConfigKeys.COMSCORE.URL] = 'http://sa.bbc.co.uk/bbc/test/s';
    conf[Echo.ConfigKeys.COMSCORE.URL] = 'http://data.bbc.co.uk/v1/analytics-echo-chamber-inbound/comscore';
    conf[Echo.ConfigKeys.RUM.URL] = 'http://data.bbc.co.uk/v1/analytics-echo-chamber-inbound/rum';

    var echoClient = new Echo.EchoClient('echo-js-test', Echo.Enums.ApplicationType.WEB, conf);

    var traceIdPrefix = 'mybbc-analytics-echo-js-test-' + (new Date().getTime()) +'-';
    var traceIdIndex = 0;
    function getTraceId() {
        return traceIdPrefix + (traceIdIndex++);
    };

    function getTraceUri(traceId) {
        return 'http://data.bbc.co.uk/v1/analytics-echo-chamber-outbound/comscore_events?'
            + 'trace=' +traceId;
    };

    function logEvent(type, data, traceId) {
        var uri = getTraceUri(traceId);
        var row = '<tr><td>' +type +'</td><td>' + (data || '-')  +'</td><td>';
        if (traceId) {
            row += '<a href="' +uri +'">' +traceId +'</a>';
        } else {
            row += '-';
        }
        row += '</td></tr>'
        $('#log tbody').prepend(row);
    };

    function parseEventLabels(eventLabelsRaw) {
        var eventLabels;
        try {
            eventLabels = JSON.parse(eventLabelsRaw);
        } catch(e) {
            console.log('Error parsing JSON', e);
        }
        eventLabels = eventLabels || {};
        return eventLabels;
    };

    $('button').attr('disabled', 'disabled');
    $('#viewEventSend').removeAttr('disabled');

    $('form').on('submit', function(e){
        e.preventDefault();
    });

    $('#mediaSet').on('click', function(e){
        var traceId, 
            contentId, 
            type, 
            episodeOrClip, 
            versionPid, 
            serviceId, 
            mediaConsumptionMode, 
            retrievalType;

        e.preventDefault();
        contentId = $('#avContentId').val();
        type = $('#avType').val();
        episodeOrClip = $('#avEpisodeOrClip').val();
        versionPid = $('#avVersionPid').val();
        serviceId = $('#avServiceId').val();
        mediaConsumptionMode = $('#avMediaConsumptionMode').val();
        retrievalType = $('#avRetrievalType').val();

        currentMedia = new Echo.Media(
            contentId,
            type,
            episodeOrClip,
            versionPid,
            serviceId,
            mediaConsumptionMode,
            retrievalType
        );

        echoClient.setMedia(currentMedia);

        logEvent(
            'Set Media'
        );

        if (!hasSetMedia) {
            hasSetMedia = true;
            $('#form-av button').removeAttr('disabled');
        }

        setMediaCount++;
        $('#set-media .badge').text(setMediaCount);
    });

    $('#avPlay').on('click', function(e){
        var position;
        position = $('#avPosition').val();
        traceId = getTraceId();
        eventLabels = { trace: traceId };
        echoClient.avPlayEvent(position, eventLabels);
        logEvent(
            'AV Play',
            'position="' +position +'"',
            traceId
        );
    });

    $('#avPause').on('click', function(e){
        var position;
        position = $('#avPosition').val();
        traceId = getTraceId();
        eventLabels = { trace: traceId };
        echoClient.avPauseEvent(position, eventLabels);
        logEvent(
            'AV Pause',
            'position="' +position +'"',
            traceId
        );
    });

    $('#viewEventSend').on('click', function(e){
        var traceId, countername, eventLabelsRaw, eventLabels;
        e.preventDefault();
        countername = $('#viewEventCounterName').val();
        eventLabelsRaw = $('#viewEventLabels').val();
        eventLabels = parseEventLabels(eventLabelsRaw);
        traceId = getTraceId();
        eventLabels.trace = traceId;
        echoClient.viewEvent(countername, eventLabels);

        logEvent(
            'View Event',
            'countername="' +countername +'"',
            traceId
        );

        if (!hasSentViewEvent) {
            hasSentViewEvent = true;
            $('#form-user-action button, #form-media button').removeAttr('disabled');
        }

        viewEventCount++;
        $('#view-event .badge').text(viewEventCount);
    });

    $('#userActionSend').on('click', function(e){
        var actionType, actionName, eventLabelsRaw, eventLabels;
        e.preventDefault();
        actionType = $('#userActionActionType').val();
        actionName = $('#userActionActionName').val();
        eventLabelsRaw = $('#userActionLabels').val();
        eventLabels = parseEventLabels(eventLabelsRaw);
        traceId = getTraceId();
        eventLabels.trace = traceId;
        echoClient.userActionEvent(actionType, actionName, eventLabels);
        logEvent(
            'User Action',
            'actionType="' +actionType +'", ' +
            'actionName="' +actionName +'"',
            traceId
        );

        userActionCount++;
        $('#user-action .badge').text(userActionCount);
    });
});

