requirejs.config({
    paths: {
        'jquery': '/vendor/jquery/jquery.min',
        'echo': '/vendor/echo/echo-2.0.0'
    }
});

require(['jquery', 'echo'], function($, Echo) {

    var currentMedia;
    var hasSentViewEvent = false;
    var hasSetMedia = false;
    var counts = {};
    var traceIdPrefix = 'mybbc-analytics-echo-js-test-' + (new Date().getTime()) +'-';
    var traceIdIndex = 0;

    // Echo config

    Echo.Debug.enable();

    var echoConfig = { };
    echoConfig[Echo.ConfigKeys.ECHO.TRACE] = 'EchoJSAVTesting';
    //conf[Echo.ConfigKeys.COMSCORE.URL] = 'http://sa.bbc.co.uk/bbc/test/s';
    echoConfig[Echo.ConfigKeys.COMSCORE.URL] = 'http://data.bbc.co.uk/v1/analytics-echo-chamber-inbound/comscore';
    echoConfig[Echo.ConfigKeys.RUM.URL] = 'http://data.bbc.co.uk/v1/analytics-echo-chamber-inbound/rum';

    var echoClient = new Echo.EchoClient('echo-js-test', Echo.Enums.ApplicationType.WEB, echoConfig);




    // Utility functions

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

    function incrementCounter(type) {
        if (!counts[type]) {
            counts[type] = 1;
        } else {
            counts[type]++;
        }
        $('#' +type +' .badge').text(counts[type]);
    }

    function avEvent(echoClientFunction, label) {
        var position;
        position = $('#avPosition').val();
        traceId = getTraceId();
        eventLabels = { trace: traceId };
        echoClientFunction.call(echoClient, position, eventLabels);
        logEvent(label, 'position="' +position +'"', traceId);
        incrementCounter('av');
    };




    // Dom manipluation and event binding

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
            retrievalType,
            cdn,
            codec;

        e.preventDefault();
        contentId = $('#avContentId').val();
        type = $('#avType').val();
        episodeOrClip = $('#avEpisodeOrClip').val();
        versionPid = $('#avVersionPid').val();
        serviceId = $('#avServiceId').val();
        mediaConsumptionMode = $('#avMediaConsumptionMode').val();
        retrievalType = $('#avRetrievalType').val();
        cdn = $('#avCDN').val();
        codec = $('#avCodec').val();

        currentMedia = new Echo.Media(
            contentId,
            type,
            episodeOrClip,
            versionPid,
            serviceId,
            mediaConsumptionMode,
            retrievalType
        );

        //currentMedia.setCDN(cdn);
        //currentMedia.setCodec(codec);

        echoClient.setMedia(currentMedia);

        logEvent('Set Media');

        if (!hasSetMedia) {
            hasSetMedia = true;
            $('#form-av button, #form-media-update button').removeAttr('disabled');
        }

        incrementCounter('set-media');
    });

    $('#mediaUpdate').on('click', function(e){
        var traceId, mediaLength, mediaBitrate, eventLabels;
        e.preventDefault();
        mediaLength = $('#mediaMediaLength').val();
        mediaBitrate = $('#mediaMediaBitrate').val();
        echoClient.setMediaLength(50000);
        echoClient.setMediaBitrate(10000);
        logEvent('Media Update');
        incrementCounter('media-update');
    });

    $('#avPlay').on('click', function(e){
        avEvent(echoClient.avPlayEvent, 'AV Play');
    });

    $('#avPause').on('click', function(e){
        avEvent(echoClient.avPauseEvent, 'AV Pause');
    });

    $('#avEnd').on('click', function(e){
        avEvent(echoClient.avEndEvent, 'AV End');
    });

    $('#avSeek').on('click', function(e){
        avEvent(echoClient.avSeekEvent, 'AV Seek');
    });

    $('#avBuffer').on('click', function(e){
        avEvent(echoClient.avBufferEvent, 'AV Buffer');
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

        logEvent('View Event', 'countername="' +countername +'"', traceId);

        if (!hasSentViewEvent) {
            hasSentViewEvent = true;
            $('#form-user-action button, #form-media button').removeAttr('disabled');
        }

        incrementCounter('view-event');
    });

    $('#userActionSend').on('click', function(e){
        var actionType, actionName, eventLabelsRaw, eventLabels;
        e.preventDefault();
        actionType = $('#userActionActionType').val();
        actionName = $('#userActionActionName').val();
        eventLabelsRaw = $('#userActionEventLabels').val();
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

        incrementCounter('user-action');
    });
});

