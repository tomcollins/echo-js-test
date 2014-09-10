/* Meta information about echo */

define('echo/meta',{
    NAME : 'echo_js',
    VERSION : '2.0.0',
    API_VERSION : '8.1.0'
});

/**
 * Simply wraps and 'console.x' method into a module
 * this way any 'console' functionality can be used without
 * worrying about cases where the 'console' object is undefined
 */



define(
/**
 * Module used to print debug/error statements to the console.
 * Exports a method "enable"
 * @exports Echo/Debug
 * @example
 * Echo.Debug.enable();
 */
'echo/util/debug',['require'],function(require){
    

    function map_console_method(method){
        var fn;
        if(typeof(console) === 'undefined' || console === null || typeof console[method] === 'undefined'){
                fn = function(){};
        }
        else if(console[method].bind !== undefined){
            fn = console[method].bind(console);
        }
        else{
            fn = function() { Function.prototype.apply.call(console[method], console, arguments); };
        }
        return fn;
    }

    function x(){}
    var exports = { // Default is to do nothing
        log : x,
        warn : x,
        error : x
    };

    var ENABLED = false; // Is DEBUG enabled?

    exports.isEnabled = function(){
        return ENABLED;
    };
    /**
     * Enable debug mode. Calling this method will result in errors
     * encountered by Echo (due to bad config/use) to be printed
     * to the console. The default behaviour is to silently fail.
     */
    exports.enable = function(){
        exports.log = map_console_method('log') || function(x){ alert(x); };
        exports.warn = map_console_method('warn') || exports.log;
        exports.error = function(msg){throw new Error("ECHO_DEBUG: "+msg);};
        //exports.error = map_console_method('error') || exports.log;
        ENABLED = true;
    };

    return exports;
});


define('echo/util/methods',['require','./debug'],function(require){
    

    var DEBUG = require('./debug');

    // Just copy an object
    function clone(obj){
        var ret = {};
        for (var p in obj){
            try{
                if(obj[p].constructor==Object){
                    ret[p] = clone(obj[p]);
                }
                else {
                    ret[p] = obj[p];
                }
            } catch(e) {
                ret[p] = obj[p];
            }
        }
        return ret;
    }


    function combineObjects(obj1, obj2, noclone) {
        var base = noclone?obj1:clone(obj1);
        for (var p in obj2) {
            try {
                if ( obj2[p].constructor==Object ) {
                    base[p] = combineObjects(base[p], obj2[p]);
                } else {
                    base[p] = obj2[p];
                }
            } catch(e) {
                base[p] = obj2[p];
            }
        }
        return base;
    }

    function containsValue(obj,val) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop) && obj[prop] === val) {
                return true;
            }
        }
        return false;
    }

    function extend(obj,fresh /* objects or key, value */){
        // If fresh, clone it dont alter it
        var o = (fresh?clone(obj):obj)||{};
        var args = arguments;
        for(var i=2,t=args.length;i<t;i++){
            if(typeof args[i] === 'object'){
                combineObjects(o,args[i],true);
            } else {
                o[args[i]] = args[++i];
            }
        }

        return o;
    }

    function addKV(obj,a,b){
        if(b){
            return extend(obj,true,a,b);
        } else {
            return extend(obj,true,a);
        }
    }

    /**
     * Checks a condition and DEBUGs an error
     * if it fails. returns the result
     */
    function assert(test,message,warn){
        if(!test){
            if(warn){
                DEBUG.warn("AssertionFailed: " + message);
            } else {
                DEBUG.error("AssertionFailed: " + message);
            }
        }
        return test;
    }

    /**
     * Checks that an object contains a value and DEBUGs
     * an error if not. Returns the result
     */
    function assertContainsValue(object,value,message){
        return assert(containsValue(object,value),message);
    }


    return {
        clone               : clone,
        combineObjects      : combineObjects,
        addKV               : addKV,
        containsValue       : containsValue,
        extend              : extend,
        assert              : assert,
        assertContainsValue : assertContainsValue
    };
});




define(
/**
 * Keys for passing in config values. Available via Echo.ConfigKeys.
 * These valuse shoud be used as the keys in the config object passed
 * to the `EchoClient` constructor
 * @exports Echo/ConfigKeys
 * @example
 * //Example config for testing
 * var Enums = Echo.Enums,
 *     conf = {};
 *
 * // Add a "trace" so we can find the vents we generate
 * conf[Enums.ECHO.TRACE] = 'mytestabcd';
 * //Point the ComScore events at the ComScore test site (so we don't
 * //dilute the live data (also it's unsampled)
 * conf[Enums.COMSCORE.URL] = 'http://sa.bbc.co.uk/bbc/test/s';
 *
 * //...now we can pass conf into new EchoClient();
 */
'echo/config/keys',[],function(){
    var exports = {
        /**
         * General Echo config
         * @property [ENABLED=true] Set to false to switch off eventing in Echo
         * @property [TRACE] For testing purposes you can set this to a unique ID
         * for your instance so events can be easily found later on
         * @property [DEVICE_ID] Use to set the device ID, this can also be set via a
         * method call on the EchoClient instance. This value will override the s1
         * cookie in DAx
         */
        ECHO : {
            ENABLED : 'echo_enabled',
            TRACE   : 'trace',
            DEVICE_ID : 'device_id',

            // These are managed internally and should not be set manually
            NAME    : 'lib_name',
            VERSION : 'lib_version'
        },
        /**
         * ComScore specific config
         * @property [ENABLED=`true`] Set to `false` to disable eventing to ComScore
         * @property [URL='http://sa.bbc.co.uk/bbc/bbc/s'] The endpoint for ComScore events.
         * In non-live environments this should be overridden. the final "bbc" in the deault url
         * represents the ComScore "site" (environment). So valid options are 'http://sa.bbc.co.uk/bbc/int/s',
         * 'http://sa.bbc.co.uk/bbc/test/s', 'http://sa.bbc.co.uk/bbc/stage/s'. EchoChamber can be used by
         * setting this value to 'http://54.217.213.38/comscore' in config
         */
        COMSCORE : {
            ENABLED : 'cs_enabled',
            URL     : 'cs_url'
        },
        /**
         * RUM specific config. To use EchoChamber, URL should be `'http://d.bbc.co.uk/echochamber/rum'`.
         * @property [ENABLED=`true`] Set to `false` to disable eventing via RUM
         * @property [URL='http://data.bbc.co.uk/v1/analytics-rum-ingress'] The enpoint for RUM events.
         */
        RUM : {
            ENABLED : 'rum_enabled',
            URL     : 'rum_url'
        }
    };

    return exports;
});


define(
/**
 * ENUM values. Available via Echo.Enums. These values are used to pass in to
 * various methods in `EchoClient` and `Media`
 * @exports Echo/Enums
 */
'echo/enumerations',[],function(){
    var exports = {
    /** COMSCORE CONFIG **/

    /** ECHO CLIENT **/
        /**
         * Type of application, used in the construction of an `EchoClient` object
         * @property WEB Standard desktop web sites
         * @property MOBILE_WEB Mobile sites
         * @property RESPONSIVE Responsive sites
         * @property MOBILE_APP Native mobile applications
         * @property BIGSCREEN_HTML Connected Tv's and STB's
         * @property BIGSCREEN_FLASH Connected Tv's and STB's
         * @property BIGSCREEN_APP TiVo Xbox Wii etc.
         */
        ApplicationType : {
            WEB             : 'web',
            MOBILE_WEB      : 'mobile-web',
            RESPONSIVE      : 'responsive',
            MOBILE_APP      : 'mobile-app',
            BIGSCREEN_HTML  : 'bigscreen-html',
            BIGSCREEN_FLASH : 'bigscreen-flash',
            BIGSCREEN_APP   : 'bigscreen-app'
        },
        /**
         * Window states, used as an argument to the EchoClient method `setPlayerWindowState()`
         * @property FULL
         * @property NORMAL
         * @property MINIMISED
         * @property MAXIMISED
         */
        WindowState : {
            FULL      : 'full',
            NORMAL    : 'norm',
            MINIMISED : 'min',
            MAXIMISED : 'max'
        },

    /** MEDIA **/
        /**
         * Type of AV content. Used in the construction of a `Media` object
         * @property AUDIO Audio content
         * @property VIDEO Video content
         */
        AvType : {
            AUDIO : 'audio',
            VIDEO : 'video'
        },
        /**
         * Retrieval Type of AV content. Used in the construction of a `Media` object
         * @property STREAM Content is being streamed
         * @property VIDEO Content is downloaded
         */
        RetrievalType : {
            STREAM : 'stream',
            DOWNLOAD : 'download'
        },
        /**
         * Retrieval Type of AV content. Used as an argument to `media.setForm()`
         * @property LONG Content is "long" (an episode)
         * @property SHORT Content is "short" (a clip)
         */
        Form : {
            LONG : 'long',
            SHORT : 'short'
        },

        /**
         * AV type to differentiate between episode and clip,
         * this is used to decide whether the content ID is
         * a clip or episode
         * @property CLIP Content is a clip
         * @property EPISODE Copntent is an episode
         */
        PIPsType : {
            CLIP : 'clip',
            EPISODE :'ep'
        },

        /**
         * Used in the construction of a Media object, this value
         * indeicates whether the stream is "live" or "on-demand"
         * @property ON_DEMAND Content is On Demand
         * @property LIVE Content is Live
         */
        MediaConsumptionMode : {
            ON_DEMAND : 'od',
            LIVE : 'li'
        },

        /**
         * Used as a parameter to `media.setScheduleMode()`
         * @property ON Content is "on schedule"
         * @property OFF Content if "off schedule"
         */
        EchoScheduleMode : {
            ON : 'on-schedule',
            OFF : 'off-schedule'
        }
    };

    return exports;
});



/**
 * Wrapper for the config for each consumer
 * This aproach could change, might push this all
 * into the delegates...
 */
define('echo/config/generator',['require','../util/debug','../util/methods','../meta','./keys'],function(require){
    

    var DEBUG = require('../util/debug'),
        Utils = require('../util/methods'),
        meta = require('../meta'),
        KEYS = require('./keys'),
        defaultConfig = {};

    // Echo
    defaultConfig[KEYS.ECHO.ENABLED] = true;
    defaultConfig[KEYS.ECHO.DEVICE_ID] = null;
    // ComScore
    defaultConfig[KEYS.COMSCORE.URL] = 'http://sa.bbc.co.uk/bbc/bbc/s';
    defaultConfig[KEYS.COMSCORE.ENABLED] = true;
    // RUM
    defaultConfig[KEYS.RUM.URL]         = 'http://ingest.rum.bbc.co.uk';
    defaultConfig[KEYS.RUM.ENABLED] = true;

    var fixedConfig = {}; // Config values that we do not want the user to overwrite
    fixedConfig[KEYS.ECHO.NAME] = meta.NAME;
    fixedConfig[KEYS.ECHO.VERSION] = meta.VERSION;


    function has_length(val){
        return ( typeof val === 'string' && val.length > 0 );
    }
    function isURLWithNoParams(str){
        return !str.match(/\?/);
    }


    function validate(conf){

        return Utils.assert(typeof conf[KEYS.ECHO.ENABLED] === 'boolean',
                    'Config: "enabled" must be boolean, got ' +
                                                conf[KEYS.ECHO.ENABLED]) &&
                Utils.assert(conf[KEYS.ECHO.DEVICE_ID] === null ||
                                (typeof conf[KEYS.ECHO.DEVICE_ID] === 'string' &&
                                 conf[KEYS.ECHO.DEVICE_ID].length),
                    'ECHO.DEVICE_ID must be an non-empty string');
    }
    function validateComScore(config) {

        return Utils.assert(has_length(config[KEYS.COMSCORE.URL]),
                    'Must have config value for COMSCORE.URL')                   &&
                Utils.assert(isURLWithNoParams(config[KEYS.COMSCORE.URL]),
                    'Comscore Config: Tailing "?" or url parameters not allowed')&&
                Utils.assert(typeof config[KEYS.COMSCORE.ENABLED] === 'boolean',
                    'ComScore config: "ENABLED" bust be boolean');
    }

    function validateRum(config) {


        return Utils.assert(has_length(config[KEYS.RUM.URL]),
                    'RUM Config: Must have config value for RUM.URL')       &&
                Utils.assert(isURLWithNoParams(config[KEYS.RUM.URL]),
                    'RUM Config: Tailing "?" and URL uparameters not allowed' +
                        'for RUM.URL')                           &&
                Utils.assert(typeof config[KEYS.RUM.ENABLED] === 'boolean',
                    'RUM config: "ENABLED" bust be boolean');
    }


    // combine and validate the config with each
    // consumer
    function combineWithBaseConfig(userConfig){
        var conf = Utils.extend(defaultConfig,true,userConfig||{},fixedConfig);
        if(! (validate(conf) && validateComScore(conf) && validateRum(conf)) ){
            return null;
        }

        return conf;
    }

    return {
        generate : combineWithBaseConfig
    };
});


define('echo/util/helper',['require','./methods','./debug'],function(require){
    

    var Util = require('./methods'),
        DEBUG = require('./debug');

    var managedLabels = ['name', 'app_name', 'app_type', 'app_version', 'ml_name', 'ml_version'];

    function cleanCounterName(name){
        var countername = name && name.replace(/(^\W*)|(\W*$)/g,'') || 'no.name.page';

        countername = countername.toLowerCase().replace(/[^a-z0-9\.]+/g,'_');

        if(name !== countername){
            if(name === null || typeof name !== 'string' || name.replace(/ */,'').length === 0){
                DEBUG.error('Countername must be a non-empty string');
            }
            if(name && name.search(/-/) !== -1){ // If there are dashes, print warning as it is actualy OK
                DEBUG.warn('Submitted countername ("'+name+'") contains at least one "-". ' +
                            'Dashes are not permitted but, for legacy reasons, "-" and "_" '+
                            'are equivalent in DAx. Echo converts dashes to underscores, so ' +
                            'the countername will be sent as "' + countername + '"');
            } else {
                DEBUG.warn('countername may only conatin: [a-z0-9._], got "' + name + '". This ' +
                            'will be cleaned up and sent as "' + countername+'"');
            }
        }
        // counternames must end in .page, silently add this
        if(countername.search(/\.page$/) == -1){
            countername += ".page";
        }

        return countername;
    }

    function cleanLabelKey(key){
        var newkey =  key && key.replace(/(^\W*)|(\W*$)/g,'').
                        toLowerCase().
                        replace(/[^a-z0-9]+/g,'_').
                        replace(/(^_)|(_$)/g,'') || "";

        Util.assert(key === newkey,
                'Label key can only contain: [a-z0-9_], and no consecutive "_"s or '+
                '"_" at the begining or end, got "'+key +
                '". This will be sent as "'+newkey+'"',true);
        return newkey;
    }

    function cleanLabelValue(value){
        if(typeof value === 'number'){
            return value.toString();
        }
        var newVal = value && value.replace(/(^\W*)|(\W*$)/g,'').
                        toLowerCase().
                        replace(/[^0-9a-z._ ]+/g,'-').
                        replace(/(^-)|(-$)/g,'') || "";
        Util.assert(value === newVal,
                'Labels value can only contain [ 0-9a-z._-], and no consecutive "-"s '+
                'and no - at the start or end. Got "' + value + '", will be replaced ' +
                'with "'+newVal+'"',true);
        return newVal;
    }

    // This is the same as any other label value, plus no spaces
    function cleanManagedLabelValue(value){
        if(typeof value === 'number'){
            return value.toString();
        }
        var newVal = value && value.replace(/(^\W*)|(\W*$)/g,'').
                        toLowerCase().
                        replace(/[^0-9a-z._]+/g,'-').
                        replace(/(^-)|(-$)/g,'') || "";
        Util.assert(value === newVal,
                'Managed Labels values (name, app_name, app_type, app_version, ml_name, ml_version) '+
                'can only contain [0-9a-z._-], and no consecutive "-"s '+
                'and no - at the start or end. Got "' + value + '", will be replaced ' +
                'with "'+newVal+'"',true);
        return newVal;
    }
    function cleanLangValue(value){// Same as managed label except allows CAPS
        if(typeof value === 'number'){
            return value.toString();
        }
        var newVal = value && value.replace(/(^\W*)|(\W*$)/g,'').
                        replace(/[^0-9a-zA-Z._]+/g,'-').
                        replace(/(^-)|(-$)/g,'') || "";
        Util.assert(value === newVal,
                'Language label value can only contain [0-9a-zA-Z._-], and no consecutive "-"s '+
                'and no - at the start or end. Got "' + value + '", will be replaced ' +
                'with "'+newVal+'"',true);
        return newVal;
    }


    function cleanLabels(labels){
        var newLabels = {},
            newKey;
        for(var key in labels){
            newKey = cleanLabelKey(key);
            if( Util.containsValue(managedLabels,newKey) ){
                newLabels[newKey] = cleanManagedLabelValue(labels[key]);
            } else {
                newLabels[newKey] = cleanLabelValue(labels[key]);
            }
        }
        return newLabels;
    }


    return {
        cleanCounterName : cleanCounterName,
        cleanLabelKey : cleanLabelKey,
        cleanLabelValue : cleanLabelValue,
        cleanManagedLabelValue : cleanManagedLabelValue,
        cleanLangValue : cleanLangValue,
        cleanLabels : cleanLabels
    };

});


define('echo/delegate/comscore/label-keys',{
    BBC_APPLICATION_NAME    : 'app_name',// Legacy BBC label
    BBC_APPLICATION_TYPE    : 'app_type',// Legacy BBC label
    BBC_COUNTER_NAME    : 'name',// Legacy BBC label
    BBC_LANGUAGE            : 'language', //ECHO-151
    DEVICE_ID           : 'istats_visitor_id', // Overrides using s1

    BBC_MEASUREMENT_LIB_NAME : 'ml_name',
    BBC_MEASUREMENT_LIB_VERSION : 'ml_version',
    ECHO_TRACE : 'trace',
    ECHO_EVENT_NAME : 'echo_event',

    // Event was triggered by user interaction
    EVENT_TRIGGERED_BY_USER : 'ns_st_ui',//ComScore label

    // See https://confluence.dev.bbc.co.uk/display/iStats/Measurement+Events
    STREAMSENSE_CUSTOM_EVENT_TYPE   : 'ns_st_ev',//ComScore label
    USER_ACTION_TYPE                : 'action_type',// Legacy BBC label
    USER_ACTION_NAME                : 'action_name',// Legacy BBC label
    PLAYLIST_END                    : 'ns_st_pe',//ComScore label

    REWIND_FF_RATE : 'ffrw_rate', // BBC label - made up by Echo team

    // Player Keys
    PLAYER_NAME         : 'ns_st_mp',//ComScore label
    PLAYER_VERSION      : 'ns_st_mv',//ComScore label
    PLAYER_WINDOW_STATE : 'ns_st_ws',//ComScore label
    PLAYER_VOLUME       : 'ns_st_vo',//ComScore label
    PLAYER_POPPED       : 'bbs_st_pop',
    PLAYER_SUBTITLED    : 'bbc_st_sub',

    // Playlist Keys
    PLAYLIST_NAME       : 'ns_st_pl',//ComScore label
    PLAYLIST_CLIP_COUNT : 'ns_st_cp',//ComScore label
    PLAYLIST_LENGTH     : 'ns_st_ca',//ComScore label

    // Media Keys
    MEDIA_PID                   : 'ns_st_ci',//ComScore label
    MEDIA_LENGTH                : 'ns_st_cl',//ComScore label
    MEDIA_BITRATE               : 'ns_st_br',//ComScore label
    MEDIA_STREAM_TYPE           : 'ns_st_ty',//ComScore label
    MEDIA_IS_LIVE               : 'ns_st_li',//ComScore label
    MEDIA_EPISODE_ID            : 'episode_id', // Legacy BBC label
    MEDIA_CLIP_ID               : 'clip_id', // Legacy BBC label
    MEDIA_CLIP_NUMBER           : 'ns_st_cn', //ComScore label
    MEDIA_PART_NUMBER           : 'ns_st_pn',//ComScore label
    MEDIA_TOTAL_PARTS           : 'ns_st_tp',//ComScore label
    MEDIA_MEDIUM                : 'bbc_st_med',            //New BBC label from Echo
    MEDIA_LIVE_OR_ONDEMAND      : 'bbc_st_lod',//New BBC label from Echo
    MEDIA_FORM                  : 'bbc_st_mf',//New BBC label from Echo
    MEDIA_RETRIEVAL_TYPE        : 'bbc_st_ret',//New BBC label from Echo
    MEDIA_SCHEDULE_INDICATOR    : 'bbc_st_sch',//New BBC label from Echo
    MEDIA_CODEC                 : 'bbc_st_co',//New BBC label from Echo
    MEDIA_CDN                   : 'bbc_st_cdn',//New BBC label from Echo
    MEDIA_VERSION_ID            : 'version_id', //NKDATA-467
    MEDIA_SERVICE_ID            : 'service_id', //NKDATA-467


    // App Tag SDK compatibility
    APP_PLATFORM_NAME       : 'ns_ap_pn',
    APP_PLATFORM_RUNTIME    : 'ns_ap_pfm',
    APP_OS_VERSION          : 'ns_ap_pfv',
    APP_DEVICE_NAME         : 'ns_ap_device',
    APP_SCREEN_RESOLUTION   : 'ns_ap_res',
    APP_LANGUAGE            : 'ns_ap_lang',
    ENV_CHAR_SET            : 'ns_c',
    ENV_TITLE               : 'c8',
    ENV_URL                 : 'c7',
    ENV_REFERRER            : 'c9',

    APP_NAME                : 'ns_ap_an',
    APP_VERSION             : 'ns_ap_ver',
    NO_COOKIES              : 'ns_nc',

    // WEB istats compatibility
    WEB_SCREEN_RES          : 'screen_resolution'

});


define(
/**
 * A class to allow for varied enrionments.
 * An instance of this can be passed into EchoClient constructor.
 * Default values are for a standard web environment.
 * @exports Echo/Environment
 */
'echo/environment',['require','./util/helper'],function(require){

    var Helper = require('./util/helper');

    /**
     * Initialise an Environment object
     * An instance of this can be passed into EchoClient constructor
     * Default values are for a standard web environment. If these are fine
     * for your purposes, then this class does not need to be used and nothing
     * need be passed into `new EchoClient()`
     * @constructor
     */
    function Environment(){
        var screen = window.screen || {},
            navigator = window.navigator || {},
            document = window.document || {};

        this._platformRuntimeEnvironment    = 'html';
        this._platformOSVersion             = '5'; //TODO


        this._screenResolution              = (screen.width||'-')+'x'+(screen.height||'-');

        this._language                      = navigator.language||'';
        this._platformName                  = navigator.platform||'';

        this._charset                       = document.characterSet || document.defaultCharset || '';
        this._title                         = document.title || '';
        this._url                           = document.URL||'';
        this._referrer                      = document.referrer||'';

        this._deviceName                    = null; // Dont send if not set
        this._httpGet                       = null; // Don't set this to _defaultHttpGet as we want to
                                                    // know if someone set it or not
        this._getCookie                     = null; // similarly
        this._setCookie                     = null;
    }

    Environment._defaultHttpGet = function(url,callback){
        var img = new Image();
        if(typeof callback === 'function'){
            img.onload = function(){
                callback();
            };
        }
        img.src = url;
    };

    Environment._defaultGetCookie = function(name,_win /* for testing, I hate this */){
        var win = _win || window;
        if (typeof win.document === 'undefined' || typeof win.document.cookie !== "string"){
            return null;
        }
        var start;
        var cookies = win.document.cookie;

        if (cookies.indexOf(name + '=') === 0){
            start = name.length + 1;
        }
        else{
            start = cookies.indexOf(' ' + name + '=');

            if (start == -1){
                return null;
            }
            else{
                start += name.length + 2;
            }
        }

        var end = cookies.indexOf(';', start);

        if (end == -1){
            end = cookies.length;
        }

        return cookies.substring(start, end);
    };

    Environment.prototype.getPlatformName = function(){
        return this._platformName;
    };
    Environment.prototype.getPlatformRuntimeEnvironment= function(){
        return this._platformRuntimeEnvironment;
    };
    Environment.prototype.getPlatformOSVersion = function(){
        return this._platformOSVersion;
    };
    Environment.prototype.getDeviceName = function(){
        return this._deviceName;
    };
    Environment.prototype.getScreenResolution = function(){
        return this._screenResolution;
    };
    Environment.prototype.getLanguage = function(){
        return this._language;
    };
    Environment.prototype.getHttpGet = function(){
        return this._httpGet;
    };
    Environment.prototype.getCookieGetter = function(){
        return this._getCookie;
    };
    Environment.prototype.getCookieSetter = function(){
        return this._setCookie;
    };
    Environment.prototype.getCharSet = function(){
        return this._charset;
    };
    Environment.prototype.getTitle = function(){
        return this._title;
    };
    Environment.prototype.getURL = function(){
        return this._url;
    };
    Environment.prototype.getReferrer = function(){
        return this._referrer;
    };

    /**
     * Set the "Platform Name". If this method is not called the
     * default value will be `window.navigator.platform`
     * @param {string} name
     * @returns {this} `this`
     */
    Environment.prototype.setPlatformName = function(name){
        this._platformName = name;
        return this;
    };
    /**
     * Set the "Platform Runtime Environment" and the "Platform OS Version".
     * If this method is not called the defaults will be `'html'` and `'5'`
     * @param {string} platformRuntimeEnvironment
     * @param {string} platformOSVersion
     * @returns {this} `this`
     */
    Environment.prototype.setPlatform = function(platformRuntimeEnvironment, platformOSVersion){
        this._platformRuntimeEnvironment = platformRuntimeEnvironment;
        this._platformOSVersion = platformOSVersion;
        return this;
    };
    /**
     * Set the "Device Name". If this method is not called the
     * default value will not be set (and potentially popluated server-side)
     * @param {string} deviceName
     * @returns {this} `this`
     */
    Environment.prototype.setDeviceName = function(deviceName){
        this._deviceName = deviceName;
        return this;
    };
    /**
     * Set the Screen Resoultion. If this method is not called the
     * default will be `window.screen.availWidth + 'x' + window.screen.availHeight`
     * @param {string} resolution
     * @example env.setScreenResolution('200x300');
     */
    Environment.prototype.setScreenResolution = function(screenResolution){
        this._screenResolution = screenResolution;
        return this;
    };
    /**
     * Set the "device Language (locale)". If this method is not called the
     * default value will be `window.navigator.language`. This should not be
     * confused with the `setContentLanguage()` EchoClient instance method which
     * asks for the language being displayed
     * @param {string} language
     * @returns {this} `this`
     */
    Environment.prototype.setLanguage = function(language){
        // ECHO-12
        this._language = Helper.cleanLangValue(language);
        return this;
    };
    /**
     * Set a function to use for httpGet request. If this method is not called
     * AJAX or an `Image` object will be used
     * @param {function} httpGet
     * @returns {this} `this`
     * @example
     * env.setHttpGet(function(url,headers,onSuccess,onError){
     *     var img = new Image();
     *     img.src = url;
     *     if(onSuccess){
     *         img.onload = onSuccess;
     *     }
     *     if(onError){
     *         img.onerror = onError;
     *     }
     * });
     */
    Environment.prototype.setHttpGet = function(httpGet){
        this._httpGet = httpGet;
        return this;
    };
    /**
     * Set a function to use for getting cookies from the environment.
     * If this method is not called, cookies will be searched for in `document.cookie`
     * @param {function} getCookie
     * @returns {this} `this`
     * @example
     * env.setCookieGetter(function(name){
     *     // get and return the "name" cookie
     * });
     */
    Environment.prototype.setCookieGetter = function(getCookie){
        this._getCookie = getCookie;
        return this;
    };
    /**
     * Set a function to use for setting cookies.
     * If this method is not called, cookies will be set on `document.cookie`
     * See the example for an example that will work on the web. The passed method should
     * accept all the parameters which the exmaple method does:
     *
     * |Name|Type|Description|
     * |----|----|-----------|
     * |`key`|String|The name of the cookie|
     * |`value`|String|The cookie value|
     * |`path`|String|The path to set the cookie on|
     * |`maxAge`|Integer|The number of milliseconds until the cookie expires|
     *
     * @param {function} setCookie
     * @returns {this} `this`
     * @example
     * env.setCookieSetter(function(key,value,path,maxAge){
     *     var t = new Date();
     *     t.setTime(t.getTime() + maxAge);
     *
     *     document.cookie = key + '=' + value + ';' +
     *                       ' expires=' + t.toUTCString() + ';' +
     *                       ' path=' + path + ';';
     * });
     */
    Environment.prototype.setCookieSetter = function(setCookie){
        this._setCookie = setCookie;
        return this;
    };
    /**
     * Set the "Character Set". If this method is not called the
     * default value will be `document.characterSet` or, failing that `docuiment.defaultCharset`
     * @param {string} charset
     * @returns {this} `this`
     */
    Environment.prototype.setCharSet = function(charSet){
        this._charset = charSet;
        return this;
    };
    /**
     * Set the page title. If this method is not called the
     * default value will be `document.title`
     * @param {string} title
     * @returns {this} `this`
     */
    Environment.prototype.setTitle = function(title){
        this._title = title;
        return this;
    };
    /**
     * Set the current URL. If this method is not called the
     * default value will be `document.URL`
     * @param {string} url
     * @returns {this} `this`
     */
    Environment.prototype.setURL = function(url){
        this._url = url;
        return this;
    };
    /**
     * Set the referrer url. If this method is not called the
     * default value will be `document.referrer`
     * @param {string} referrer
     * @returns {this} `this`
     */
    Environment.prototype.setReferrer = function(ref){
        this._referrer = ref;
        return this;
    };

    return Environment;

});





/**
 * This is a slightly modified verison of ComScore's
 * StreamSense library. Code added by the BBC
 * is wrapped in comments like:
 * /*** Addtion by BBC START ***\/
 * var inserted_code;
 * /*** Addition by BBC END ***\/
 */
/*** Addtion by BBC START ***/
define('echo/delegate/comscore/streamsense-bbc',[],function(){
/*** Addition by BBC END ***/


/* Copyright (c) 2013 comScore, Inc. comScore SDK 4.1309.17
 * All rights reserved.
 * By using this software, you are agreeing to be bound by the
 * terms of this policies: http://www.comscore.com/About_comScore/Privacy_Policy
 */
var ns_ = ns_ || {};

ns_.StreamSense = ns_.StreamSense || (function() {
function httpGet(url, callback) {
    var img = new Image();
    img.src = url;
    callback && setTimeout(callback, 0);
}

function httpPost(url, data, callback) {
    callback && setTimeout(callback, 0);
}
/**
 * Allow the player to send a page view event.
 * @public
 * @param {String} [pixelUrl] if specified, overwrites all other pixelUrl
 * values
 * @param {Object} [labels]
 */
function viewNotify(pixelUrl, labels) {
/*** Addition by BBC START ***/
/* This method should not be called as we dont abstract it */
    throw new Error("comScore StreamSense viewNotify method should not be used");
/*
    var
        baseUrl = pixelUrl || '' // TODO empty?
        , _utils = Utils
        , undef = 'undefined'
        , comScore = window.comScore ||
            window.sitestat || function (u) {
                var cN = "comScore=",    // cookie name
                    d = document,           // shortcut
                    cookie = d.cookie,      // shortcut
                    ux = "",                // ux values from cookie
                    indexOf = "indexOf",    // shortcut
                    substring = "substring", // shortcut
                    length = 'length',       // shortcut
                    limit = 2048,           // URL limit
                    last,                   // lastIndexOf &
                    ns_ = "&ns_",
                    ampersand = "&",
                    i,
                    c,
                    j,
                    l,
                    win = window, // this?self?window?
                    esc = win.encodeURIComponent || escape; // Define the encoding method

                if (cookie[indexOf](cN)+1) {
                    for (j = 0, c = cookie.split(";"), l = c[length]; j < l; j++) {
                        i = c[j][indexOf](cN);
                        (i+1) && (ux = ampersand + unescape(c[j][substring](i + cN[length])));
                    }
                }

                u += ns_ + "_t=" + (+new Date)
                + ns_ + "c=" + (d.characterSet || d.defaultCharset || "")
                + "&c8=" + esc(d.title)
                + ux
                + "&c7=" + esc(d.URL)
                + "&c9=" + esc(d.referrer);

                if (u[length] > limit && u[indexOf](ampersand) > 0) {
                    last = u[substring](0, limit - 8).lastIndexOf(ampersand);

                    u = (u[substring](0, last)
                        + ns_ + "cut="
                        + esc(u[substring](last + 1)))[substring](0, limit);
                }

                httpGet(u);

                if (typeof ns_p === undef) {
                    ns_p = { src: u };
                }
                ns_p.lastMeasurement = u; // TODO Testing, need to remove it?
            }

    if (typeof labels !== undef) {
        var l = []
            , esc = window.encodeURIComponent || escape // Define the encoding method
        for (var label in labels) {
            if (labels.hasOwnProperty(label)) {
                l.push(esc(label) + '=' + esc(labels[label]));
            }
        }
        baseUrl += '&' + l.join('&');
    }
    return comScore(baseUrl);
*/
/*** Addition by BBC END ***/
}

function prepareUrl(pixelURL, labels) {
    var u
        , limit = 2048
        , d = document
        , win = window
        , esc = win.encodeURIComponent || escape
        , l = []
        , orderedLabels = StreamSenseConstants.LABELS_ORDER
        , pixelUrlSplit  = pixelURL.split('?')
        , pixelUrlBase   = pixelUrlSplit[0]
        , pixelUrlParams = pixelUrlSplit[1]
        , pixelUrlPairs  = pixelUrlParams.split('&')

    for (var i=0,n=pixelUrlPairs.length; i<n; i++) {
        var kv = pixelUrlPairs[i].split('='),
            k = unescape(kv[0]),
            v = unescape(kv[1]);
        labels[k] = v;
    }

    var seen = {};
    for (var i=0,n=orderedLabels.length; i<n; i++) {
        var label = orderedLabels[i];
        if (labels.hasOwnProperty(label)) {
            seen[label] = true;
            l.push(esc(label) + '=' + esc(labels[label]));
        }
    }

    for (var label in labels) {
        if (seen[label]) continue;
        if (labels.hasOwnProperty(label)) {
            l.push(esc(label) + '=' + esc(labels[label]));
        }
    }

    u = pixelUrlBase + '?' + l.join('&');

    u = u
        + (u.indexOf("&c8=") < 0 ? "&c8=" + esc(d.title) : "")
        + (u.indexOf("&c7=") < 0 ? "&c7=" + esc(d.URL) : "")
        + (u.indexOf("&c9=") < 0 ? "&c9=" + esc(d.referrer) : "");

    if (u.length > limit && u.indexOf('&') > 0) {
        last = u.substr(0, limit - 8).lastIndexOf('&');

        u = (u.substring(0, last)
            + "&ns_cut="
            + esc(u.substring(last + 1))).substr(0, limit);
    }
    return u;
}
var Utils = (function() {
/**
 * Utility function, singleton because it has no instance data.
 * @constructor
 */

var Utils = {

    /**
    * Generate unique ID composed by time (milliseconds) plus the number of IDs
    * generated so far..
    * @function
    * @return {String}
    */
    uid: (function () {
        var
            /**
            * Number of unique generated IDs.
            * @private
            * @type Number
            */
            counter = 1;
        return function () {
            return +new Date() + '_' + counter++;
        }
    }()),

    /**
    * Filters the object with the provided function.
    * @param {Function} condition Function which will be used to filter the object, should return true if the item should be included in the returned object
    * @param {Object} obj Object that will be filtered. The provided object won't be modified.
    * @returns {Object} Returns the object which will contain only the values that pass the provided condition.
    */
    filter: function(condition, obj) {
        var ret = {};
        for (var j in obj) {
            if (obj.hasOwnProperty(j) && condition(obj[j])) {
                ret[j] = obj[j];
            }
        }
        return ret;
    },

    /**
    * Extend toExtend with all the own properties of o1..N. If a property with the same
    * name already exists in toExtend, the value will be replaced with the value of
    * the oX property. toExtend will be EXTENDED and returned. The function doesn't
    * follow the property tree. WARNING the first argument will be MODIFIED.
    * @param {Object} toExtend object to be extended and returned
    * @param {Object} o1..N source of the properties obj1 will be extended with
    * @returns {Object|null} toExtend extended with o1..n properties
    */
    extend: function (toExtend /** o1, ... */) {
        var
            argsLength = arguments.length
            , obj

        toExtend = toExtend || {};

        for (var i = 1; i < argsLength; i++) {
            obj = arguments[i];
            if (!obj) {
                continue; //-->
            }
            for (var j in obj) {
                if (obj.hasOwnProperty(j)) {
                    toExtend[j] = obj[j];
                }
            }
        }

        return toExtend;
    },

    getLong: function(value, defaultValue) {
        var ret = Number(value);
        return (value == null || isNaN(ret)) ? (defaultValue || 0) : ret;
    },

    getInteger: function(value, defaultValue) {
        var ret = Number(value);
        return (value == null || isNaN(ret)) ? (defaultValue || 0) : ret;
    },

    getBoolean: function(value, defaultValue) {
        var ret = String(value).toLowerCase() == 'true';
        return (value == null) ? (defaultValue || false) : ret;
    },

    isNotEmpty: function(str) {
        return str != null && str.length > 0;
    },

    regionMatches: function(to, toffset, other, ooffset, len) {
        if (toffset < 0 || ooffset < 0 || toffset + len > to.length || ooffset + len > other.length) return false;

        while (--len >= 0) {
            var c1 = to.charAt(toffset++);
            var c2 = other.charAt(ooffset++);
            if (c1 != c2) return false;
        }
        return true;
    }
}

    Utils.filterMap = function(map, keepKeys) {
        for (var keyName in map) {
            if (keepKeys.indexOf(keyName) == -1) {
                delete map[keyName];
            }
        }
    }

    return Utils;
})();
var StreamSenseEventType = (function() {
    var stringMap = [ "play", "pause", "end", "buffer", "keep-alive", "hb", "custom", "ad_play", "ad_pause", "ad_end", "ad_click" ];
    return {
        PLAY: 0,
        PAUSE: 1,
        END: 2,
        BUFFER: 3,
        KEEP_ALIVE: 4,
        HEART_BEAT: 5,
        CUSTOM: 6,
        AD_PLAY: 7,
        AD_PAUSE: 8,
        AD_END: 9,
        AD_CLICK: 10,
        toString: function(eventType) {
            return stringMap[eventType];
        }
    };
})();

var State = (function() {
    var eventTypeMap = [StreamSenseEventType.END, StreamSenseEventType.PLAY, StreamSenseEventType.PAUSE, StreamSenseEventType.BUFFER];

    return {
        IDLE: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        toEventType: function(state) {
            return eventTypeMap[state];
        }
    };
})();

var AdEvents = {
    ADPLAY: StreamSenseEventType.AD_PLAY,
    ADPAUSE: StreamSenseEventType.AD_PAUSE,
    ADEND: StreamSenseEventType.AD_END,
    ADCLICK: StreamSenseEventType.AD_CLICK
};
var StreamSenseConstants = {
    STREAMSENSE_VERSION: '4.1309.17',
    STREAMSENSEMEDIAPLAYER_VERSION: '4.1309.17',
    STREAMSENSEVIDEOVIEW_VERSION: '4.1309.17',
  DEFAULT_HEARTBEAT_INTERVAL: [ { playingtime: 60000, interval: 10000 }, { playingtime: null, interval: 60000 } ],
    //KEEP_ALIVE_PERIOD: 1200000,
    KEEP_ALIVE_PERIOD: 10000,
    PAUSED_ON_BUFFERING_PERIOD: 500,
    PAUSE_PLAY_SWITCH_DELAY: 500,
    DEFAULT_PLAYERNAME: "streamsense",
    C1_VALUE: "19",
    C10_VALUE: "js",
    NS_AP_C12M_VALUE: "1",
    NS_NC_VALUE: "1",
    PAGE_NAME_LABEL: "name",
  LABELS_ORDER: [
      "c1", "c2", "ns_site", "ns_vsite",
      "ns_ap_an", "ns_ap_pn", "ns_ap_pv", "c12", "name", "ns_ak", "ns_ap_ec", "ns_ap_ev", "ns_ap_device",
      "ns_ap_id", "ns_ap_csf", "ns_ap_bi", "ns_ap_pfm", "ns_ap_pfv", "ns_ap_ver", "ns_ap_sv",
      "ns_type", "ns_radio", "ns_nc", "ns_ap_ui", "ns_ap_gs",
      "ns_st_sv", "ns_st_pv", "ns_st_it", "ns_st_id", "ns_st_ec", "ns_st_sp", "ns_st_sq", "ns_st_cn",
      "ns_st_ev", "ns_st_po", "ns_st_cl", "ns_st_el", "ns_st_pb", "ns_st_hc", "ns_st_mp", "ns_st_mv", "ns_st_pn",
      "ns_st_tp", "ns_st_pt", "ns_st_pa", "ns_st_ad", "ns_st_li", "ns_st_ci",
      "ns_ap_jb", "ns_ap_res", "ns_ap_c12m", "ns_ap_install", "ns_ap_updated", "ns_ap_lastrun",
      "ns_ap_cs", "ns_ap_runs", "ns_ap_usage", "ns_ap_fg", "ns_ap_ft", "ns_ap_dft", "ns_ap_bt", "ns_ap_dbt",
      "ns_ap_dit", "ns_ap_as", "ns_ap_das", "ns_ap_it", "ns_ap_uc", "ns_ap_aus", "ns_ap_daus", "ns_ap_us",
      "ns_ap_dus", "ns_ap_ut", "ns_ap_oc", "ns_ap_uxc", "ns_ap_uxs", "ns_ap_lang", "ns_ap_miss", "ns_ts",
      "ns_st_ca", "ns_st_cp", "ns_st_er", "ns_st_pe", "ns_st_ui", "ns_st_bc", "ns_st_bt",
      "ns_st_bp", "ns_st_pc", "ns_st_pp", "ns_st_br", "ns_st_ub", "ns_st_vo", "ns_st_ws", "ns_st_pl", "ns_st_pr",
      "ns_st_ep", "ns_st_ty", "ns_st_cs", "ns_st_ge", "ns_st_st", "ns_st_dt", "ns_st_ct",
      "ns_st_de", "ns_st_pu", "ns_st_cu", "ns_st_fee",
      "c7", "c8", "c9"
  ]
};
var Clip = (function() {
    var Clip = function() {
        var self = this
            , pauses = 0
            , starts = 0
            , bufferingTime = 0
            , bufferingTimestamp = 0
            , playbackTime = 0
            , playbackTimestamp = 0
            , clipId
            , _labels

        function store(key, labels) {
            var value = labels[key];
            if (value != null) {
                _labels[key] = value;
            }
        }

        Utils.extend(this, {
            reset: function(keepLabels) {
                if (keepLabels != null && keepLabels.length > 0) {
                    Utils.filterMap(_labels, keepLabels);
                } else {
                    _labels = {};
                }

                _labels["ns_st_cl"] = "0";
                _labels["ns_st_pn"] = "1";
                _labels["ns_st_tp"] = "1";
                self.setClipId("1");
                self.setPauses(0);
                self.setStarts(0);
                self.setBufferingTime(0);
                self.setBufferingTimestamp(-1);
                self.setPlaybackTime(0);
                self.setPlaybackTimestamp(-1);
            },

            setLabels: function(newLabels, state) {
                if (newLabels != null) {
                    Utils.extend(_labels, newLabels);
                }
                self.setRegisters(_labels, state);
            },

            getLabels: function() {
                return _labels;
            },

            setLabel: function(label, value) {
                var map = {};
                map[label] = value;

                self.setLabels(map, null);
            },

            getLabel: function(label) {
                return _labels[label];
            },

            getClipId: function() {
                return clipId;
            },

            setClipId: function(cid) {
                clipId = cid;
            },

            setRegisters: function(labels, state) {
                var value = labels["ns_st_cn"];
                if (value != null) {
                    clipId = value;
                    delete labels["ns_st_cn"];
                }

                value = labels["ns_st_bt"];
                if (value != null) {
                    bufferingTime = Number(value);
                    delete labels["ns_st_bt"]
                }

                store("ns_st_cl", labels);
                store("ns_st_pn", labels);
                store("ns_st_tp", labels);
                store("ns_st_ub", labels);
                store("ns_st_br", labels);

                if (state == State.PLAYING || state == null) {
                    value = labels["ns_st_sq"];
                    if (value != null) {
                        starts = Number(value);
                        delete labels["ns_st_sq"];
                    }
                }

                if (state != State.BUFFERING) {
                    value = labels["ns_st_pt"];
                    if (value != null) {
                        playbackTime = Number(value);
                        delete labels["ns_st_pt"];
                    }
                }

                if (state == State.PAUSED || state == State.IDLE || state == null) {
                    value = labels["ns_st_pc"];
                    if (value != null) {
                        pauses = Number(value);
                        delete labels["ns_st_pc"];
                    }
                }
            },

            createLabels: function(eventType, initialLabels) {
                var labelMap = initialLabels || {};
                labelMap["ns_st_cn"] = self.getClipId();
                labelMap["ns_st_bt"] = String(self.getBufferingTime());

                if (eventType == StreamSenseEventType.PLAY || eventType == null) {
                    labelMap["ns_st_sq"] = String(starts);
                }
                if (eventType == StreamSenseEventType.PAUSE || eventType == StreamSenseEventType.END || eventType == StreamSenseEventType.KEEP_ALIVE || eventType == StreamSenseEventType.HEART_BEAT || eventType == null) {
                    labelMap["ns_st_pt"] = String(self.getPlaybackTime());
                    labelMap["ns_st_pc"] = String(pauses);
                }

                Utils.extend(labelMap, self.getLabels());
                return labelMap;
            },

            incrementPauses: function() {
                pauses++;
            },

            incrementStarts: function() {
                starts++;
            },

            getBufferingTime: function() {
                var ret = bufferingTime;

                if (bufferingTimestamp >= 0) {
                    ret += +new Date() - bufferingTimestamp;
                }
                return ret;
            },

            setBufferingTime: function(bt) {
                bufferingTime = bt;
            },

            getPlaybackTime: function() {
                var ret = playbackTime;

                if (playbackTimestamp >= 0) {
                    ret += +new Date() - playbackTimestamp;
                }
                return ret;
            },

            setPlaybackTime: function(pt) {
                playbackTime = pt;
            },

            getPlaybackTimestamp: function() {
                return playbackTimestamp;
            },

            setPlaybackTimestamp: function(pt) {
                playbackTimestamp = pt;
            },

            getBufferingTimestamp: function() {
                return bufferingTimestamp;
            },

            setBufferingTimestamp: function(bt) {
                bufferingTimestamp = bt;
            },

            getPauses: function() {
                return pauses;
            },

            setPauses: function(p) {
                pauses = p;
            },

            getStarts: function() {
                return starts;
            },

            setStarts: function(s) {
                starts = s;
            }
        });

        _labels = {};
        self.reset();
    }

    return Clip;
})();
var Playlist = (function() {
    var Playlist = function() {
        var self = this
            , clip = null
            , playlistId
            , starts = 0
            , pauses = 0
            , rebufferCount = 0
            , bufferingTime = 0
            , playbackTime = 0
            , _labels
            , playlistCounter = 0
            , firstPlayOccurred = false

        Utils.extend(this, {
            reset: function(keepLabels) {
                if (keepLabels != null && keepLabels.length > 0) {
                    Utils.filterMap(_labels, keepLabels);
                } else {
                    _labels = {};
                }

                self.setPlaylistId(+new Date() + "_" + playlistCounter);
                self.setBufferingTime(0);
                self.setPlaybackTime(0);
                self.setPauses(0);
                self.setStarts(0);
                self.setRebufferCount(0);
                firstPlayOccurred = false;
            },

            setLabels: function(newLabels, state) {
                if (newLabels != null) {
                    Utils.extend(_labels, newLabels);
                }
                self.setRegisters(_labels, state);
            },

            getLabels: function() {
                return _labels;
            },

            setLabel: function(label, value) {
                var map = {};
                map[label] =  value;
                self.setLabels(map, null);
            },

            getLabel: function(label) {
                return _labels[label];
            },

            getClip: function() {
                return clip;
            },

            getPlaylistId: function() {
                return playlistId;
            },

            setPlaylistId: function(pid) {
                playlistId = pid;
            },

            setRegisters: function(labels, state) {

                var value = labels["ns_st_sp"];
                if (value != null) {
                    starts = Number(value);
                    delete labels["ns_st_sp"];
                }

                value = labels["ns_st_bc"];
                if (value != null) {
                    rebufferCount = Number(value);
                    delete labels["ns_st_bc"];
                }

                value = labels["ns_st_bp"];
                if (value != null) {
                    bufferingTime = Number(value);
                    delete labels["ns_st_bp"];
                }

                value = labels["ns_st_id"];
                if (value != null) {
                    playlistId = value;
                    delete labels["ns_st_id"];
                }


                if (state != State.BUFFERING) {
                    value = labels["ns_st_pa"];
                    if (value != null) {
                        playbackTime = Number(value);
                        delete labels["ns_st_pa"];
                    }
                }

                if (state == State.PAUSED || state == State.IDLE || state == null) {
                    value = labels["ns_st_pp"];
                    if (value != null) {
                        pauses = Number(value);
                        delete labels["ns_st_pp"];
                    }
                }
            },

            createLabels: function(eventType, initialLabels) {
                var labelMap = initialLabels || {};
                labelMap["ns_st_bp"] = String(self.getBufferingTime());
                labelMap["ns_st_sp"] = String(starts);
                labelMap["ns_st_id"] = String(playlistId);

                if (rebufferCount > 0) {
                    labelMap["ns_st_bc"] = String(rebufferCount);
                }

                if (eventType == StreamSenseEventType.PAUSE || eventType == StreamSenseEventType.END || eventType == StreamSenseEventType.KEEP_ALIVE || eventType == StreamSenseEventType.HEART_BEAT || eventType == null) {
                    labelMap["ns_st_pa"] = String(self.getPlaybackTime());
                    labelMap["ns_st_pp"] = String(pauses);
                }

                if (eventType == StreamSenseEventType.PLAY || eventType == null) {
                    if (!self.didFirstPlayOccurred()) {
                        labelMap["ns_st_pb"] = "1";
                        self.setFirstPlayOccurred(true);
                    }
                }

                Utils.extend(labelMap, self.getLabels());
                return labelMap;
            },

            incrementStarts: function() {
                starts++;
            },

            incrementPauses: function() {
                pauses++;
                clip.incrementPauses();
            },

            setPlaylistCounter: function(pc) {
                playlistCounter = pc;
            },

            incrementPlaylistCounter: function() {
                playlistCounter++;
            },

            addPlaybackTime: function(now) {
                if (clip.getPlaybackTimestamp() >= 0) {
                    var diff = now - clip.getPlaybackTimestamp();
                    clip.setPlaybackTimestamp(-1); // setting the timestamp to avoid adding time offset calculated in getter method
                    clip.setPlaybackTime(clip.getPlaybackTime() + diff);
                    self.setPlaybackTime(self.getPlaybackTime() + diff);
                }
            },

            addBufferingTime: function(now) {
                if (clip.getBufferingTimestamp() >= 0) {
                    var diff = now - clip.getBufferingTimestamp();
                    clip.setBufferingTimestamp(-1); // setting the timestamp to avoid adding time offset calculated in getter method
                    clip.setBufferingTime(clip.getBufferingTime() + diff);
                    self.setBufferingTime(self.getBufferingTime() + diff);
                }
            },

            getBufferingTime: function() {
                var ret = bufferingTime;
                if (clip.getBufferingTimestamp() >= 0) {
                    ret += +new Date() - clip.getBufferingTimestamp();
                }
                return ret;
            },

            setBufferingTime: function(bt) {
                bufferingTime = bt;
            },

            getPlaybackTime: function() {
                var ret = playbackTime;
                if (clip.getPlaybackTimestamp() >= 0) {
                    ret += +new Date() - clip.getPlaybackTimestamp();
                }

                return ret;
            },

            setPlaybackTime: function(pt) {
                playbackTime = pt;
            },

            getStarts: function() {
                return starts;
            },

            setStarts: function(s) {
                starts = s;
            },

            getPauses: function() {
                return pauses;
            },

            setPauses: function(p) {
                pauses = p;
            },

            getRebufferCount: function() {
                return rebufferCount;
            },

            incrementRebufferCount: function() {
                rebufferCount++;
            },

            setRebufferCount: function(rc) {
                rebufferCount = rc;
            },

            didFirstPlayOccurred: function() {
                return firstPlayOccurred;
            },

            setFirstPlayOccurred: function(fpo) {
                firstPlayOccurred = fpo;
            }
        });

        clip = new Clip();
        _labels = {};
        self.reset();
    }

    return Playlist;
})();
var StreamSense = (function() {
    var StreamSense = function(aLabels, aPixelURL) {
        var self = this
            , persistentLabelMap
            , pixelURL = null
            , lastStateChangeTimestamp = 0
            , lastKnownPosition = 0
            , currentState
            , nextEventCount = 0
            , playlist = null
            , core
            , sdkPersistentLabelsSharing = true
            , pausedOnBufferingTimer
            , pauseOnBufferingEnabled = true
            , keepAliveTimer
            , delayedTransitionTimer
            , heartBeatTimer
            , heartbeatIntervals = StreamSenseConstants.DEFAULT_HEARTBEAT_INTERVAL
            , nextHeartBeatInterval = 0
            , heartBeatCount = 0
            , nextHeartBeatTimestamp = 0
            , pausePlaySwitchDelayEnabled = false
            , lastStateWithMeasurement
            , mediaPlayerName
            , mediaPlayerVersion
            , measurementSnapshot
            , listenerList
            , exports = {}


        function setHeartbeatIntervals(intervals) {
          heartbeatIntervals = intervals; 
        }

        function getHeartBeatInterval(playbackTime) {
          var res = 0;
          if (heartbeatIntervals != null){
            for (var i=0; i<heartbeatIntervals.length; i++) {
              var obj = heartbeatIntervals[i];
              var playingTime = obj.playingtime;
              if (!playingTime || playbackTime < playingTime) {
                res = obj.interval;
                break;
              }
            }
          }
          return res;
        }

        function resumeHeartBeatTimer() {

            releaseHeartBeatTimer();

            var interval = getHeartBeatInterval(playlist.getClip().getPlaybackTime());

            if (interval > 0) {
              var delay = nextHeartBeatInterval > 0 ? nextHeartBeatInterval : interval;
              heartBeatTimer = setTimeout(dispatchHeartBeatEvent, delay);
            }

            nextHeartBeatInterval = 0;
        }

        function pauseHeartBeatTimer() {
            releaseHeartBeatTimer();
            var interval = getHeartBeatInterval(playlist.getClip().getPlaybackTime());
            nextHeartBeatInterval = interval - (playlist.getClip().getPlaybackTime() % interval);
            if (heartBeatTimer != null) {
              releaseHeartBeatTimer();
            }
        }

        function resetHeartBeatTimer() {
            nextHeartBeatInterval = 0;
            nextHeartBeatTimestamp = 0;
            heartBeatCount = 0;
        }

        function dispatchHeartBeatEvent() {
            heartBeatCount++;

            var eventLabelMap = createMeasurementLabels(StreamSenseEventType.HEART_BEAT, null);
            dispatch(eventLabelMap);

            nextHeartBeatInterval = 0;
            resumeHeartBeatTimer();
        }

        function releaseHeartBeatTimer() {
            if (heartBeatTimer != null) {
                clearTimeout(heartBeatTimer);
                heartBeatTimer = null;
            }
        }

        function startKeepAliveTimer() {

            stopKeepAliveTimer();

            keepAliveTimer = setTimeout(dispatchKeepAlive, StreamSenseConstants.KEEP_ALIVE_PERIOD);
        }

        function dispatchKeepAlive() {
            var eventLabelMap = createMeasurementLabels(StreamSenseEventType.KEEP_ALIVE, null);

            dispatch(eventLabelMap);
            nextEventCount++;
            startKeepAliveTimer();
        }

        function stopKeepAliveTimer() {
            if (keepAliveTimer != null) {
                clearTimeout(keepAliveTimer);
                keepAliveTimer = null;
            }
        }

        function startPausedOnBufferingTimer() {
            stopPausedOnBufferingTimer();

            if (self.isPauseOnBufferingEnabled() && willCauseMeasurement(State.PAUSED)) {
                pausedOnBufferingTimer = setTimeout(dispatchPausedOnBufferingEvent, StreamSenseConstants.PAUSED_ON_BUFFERING_PERIOD)
            }
        }

        function dispatchPausedOnBufferingEvent() {
            if (lastStateWithMeasurement == State.PLAYING) {

                playlist.incrementRebufferCount();
                playlist.incrementPauses();

                var labels = createMeasurementLabels(StreamSenseEventType.PAUSE, null);

                dispatch(labels);
                nextEventCount++;
                lastStateWithMeasurement = State.PAUSED;
            }
        }

        function stopPausedOnBufferingTimer() {
            if (pausedOnBufferingTimer != null) {
                clearTimeout(pausedOnBufferingTimer);
                pausedOnBufferingTimer = null;
            }
        }

        function stopDelayedTransitionTimer() {
            if (delayedTransitionTimer != null) {
                clearTimeout(delayedTransitionTimer);
                delayedTransitionTimer = null;
            }
        }

        function isPlayOrPause(state) {

            return state == State.PLAYING || state == State.PAUSED;
        }

        function eventTypeToState(event) {
            if (event == StreamSenseEventType.PLAY) {
                return State.PLAYING;
            } else if (event == StreamSenseEventType.PAUSE) {
                return State.PAUSED;
            } else if (event == StreamSenseEventType.BUFFER) {
                return State.BUFFERING;
            } else if (event == StreamSenseEventType.END) {
                return State.IDLE;
            }

            return null;
        }

        function transitionTo(newState, eventLabelMap, delay) {
            stopDelayedTransitionTimer();

            if (canTransitionTo(newState)) {
                if (delay) {
                    setTimeout(function() {
                        transitionTo(newState, eventLabelMap);
                    }, delay);
                } else {
                    var oldState = getState();
                    var previousStateChangeTimestamp = lastStateChangeTimestamp;
                    var eventTime = getTime(eventLabelMap);
                    var delta = (previousStateChangeTimestamp >= 0) ? eventTime - previousStateChangeTimestamp : 0;

                    onExit(getState(), eventLabelMap);
                    onEnter(newState, eventLabelMap);
                    setState(newState);

                    for (var i = 0, len = listenerList.length; i < len; i++) {
                        listenerList[i](oldState, newState, eventLabelMap, delta);
                    }

                    setRegisters(eventLabelMap);
                    playlist.setRegisters(eventLabelMap, newState);
                    playlist.getClip().setRegisters(eventLabelMap, newState);

                    var dispatchLabels = createMeasurementLabels(State.toEventType(newState), eventLabelMap);
                    Utils.extend(dispatchLabels, eventLabelMap);

                    if (willCauseMeasurement(currentState)) {
                        dispatch(dispatchLabels);
                        lastStateWithMeasurement = currentState;
                        nextEventCount++;
                    }
                }
            }
        }

        function setRegisters(labels) {

            var value = labels["ns_st_mp"];
            if (value != null) {
                mediaPlayerName = value;
                delete labels["ns_st_mp"];
            }

            value = labels["ns_st_mv"];
            if (value != null) {
                mediaPlayerVersion = value;
                delete labels["ns_st_mv"];
            }

            value = labels["ns_st_ec"];
            if (value != null) {
                nextEventCount = Number(value);
                delete labels["ns_st_ec"];
            }
        }

        function dispatch(eventLabelMap, snapshot) {
            if (snapshot === undefined) {
                snapshot = true;
            }
            if (snapshot) {
                makeMeasurementSnapshot(eventLabelMap);
            }

            var pixelURL = self.getPixelURL();
            if (core) {
                if (!isNotProperlyInitialized()) {
                    var ApplicationMeasurement = exports.am, EventType = exports.et;
                    var m = ApplicationMeasurement.newApplicationMeasurement(core, EventType.HIDDEN, eventLabelMap, pixelURL);
                    core.getQueue().offer(m);
                }
            } else if (pixelURL) {
                httpGet(prepareUrl(pixelURL, eventLabelMap));
            }
        }

        function isNotProperlyInitialized() {
            var appContext = core.getAppContext();
            var salt = core.getSalt();
            var pixelURL = core.getPixelURL();
            return appContext == null || salt == null || salt.length == 0 || pixelURL == null || pixelURL.length == 0;
        }

        function makeMeasurementSnapshot(labels) {
            measurementSnapshot = createMeasurementLabels(null);
            Utils.extend(measurementSnapshot, labels);
        }

        function onExit(oldState, eventLabelMap) {
            var eventTime = getTime(eventLabelMap);

            if (oldState == State.PLAYING) {
                playlist.addPlaybackTime(eventTime);
                pauseHeartBeatTimer();
                stopKeepAliveTimer();
            } else if (oldState == State.BUFFERING) {
                playlist.addBufferingTime(eventTime);
                stopPausedOnBufferingTimer();
            }
        }

        function onEnter(newState, eventLabelMap) {
            var eventTime = getTime(eventLabelMap);

            var playerPosition = getPlayerPosition(eventLabelMap);
            lastKnownPosition = playerPosition;

            if (newState == State.PLAYING) {
                resumeHeartBeatTimer();
                startKeepAliveTimer();
                playlist.getClip().setPlaybackTimestamp(eventTime);

                if (willCauseMeasurement(newState)) {
                    playlist.getClip().incrementStarts();
                    if (playlist.getStarts() < 1) {

                        playlist.setStarts(1);
                    }
                }
            } else if (newState == State.PAUSED) {
                if (willCauseMeasurement(newState)) {
                    playlist.incrementPauses();
                }
            } else if (newState == State.BUFFERING) {
                playlist.getClip().setBufferingTimestamp(eventTime);
                if (pauseOnBufferingEnabled) {
                    startPausedOnBufferingTimer();
                }
            } else if (newState == State.IDLE) {

                resetHeartBeatTimer();
            }
        }

        function willCauseMeasurement(state) {

            if (state == State.PAUSED && (lastStateWithMeasurement == State.IDLE || lastStateWithMeasurement == null)) {
                return false;
            } else {
                return state != State.BUFFERING && lastStateWithMeasurement != state;
            }
        }

        function getPlayerPosition(labelMap) {

            var playerPosition = -1;
            if (labelMap.hasOwnProperty("ns_st_po")) {
                playerPosition = Number(labelMap["ns_st_po"]);
            }
            return playerPosition;
        }

        function getTime(labelMap) {
            var time = -1;
            if (labelMap.hasOwnProperty("ns_ts")) {
                time = Number(labelMap["ns_ts"]);
            }
            return time;
        }

        function canTransitionTo(newState) {
            return (newState != null) && (getState() != newState);
        }

        function setState(newState) {
            currentState = newState;
            lastStateChangeTimestamp = +new Date();
        }

        function getState() {
            return currentState;
        }

        function createMeasurementLabels() {
            var eventType, initialLabels;
            if (arguments.length == 1) {
                eventType = State.toEventType(currentState);
                initialLabels = arguments[0];
            } else {
                eventType = arguments[0];
                initialLabels = arguments[1];
            }
            var labelMap = {};

            if (initialLabels != null) {
                Utils.extend(labelMap, initialLabels);
            }

            if (!labelMap.hasOwnProperty("ns_ts")) {
                labelMap["ns_ts"] = String(+new Date());
            }

            if (eventType != null && !labelMap.hasOwnProperty("ns_st_ev")) {
                labelMap["ns_st_ev"] = StreamSenseEventType.toString(eventType);
            }

            if (self.isPersistentLabelsShared() && core) {
                Utils.extend(labelMap, core.getLabels());
            }

            Utils.extend(labelMap, self.getLabels());

            createLabels(eventType, labelMap);

            playlist.createLabels(eventType, labelMap);

            playlist.getClip().createLabels(eventType, labelMap);

            if (!labelMap.hasOwnProperty("ns_st_mp")) {

                labelMap["ns_st_mp"] = mediaPlayerName;
            }

            if (!labelMap.hasOwnProperty("ns_st_mv")) {

                labelMap["ns_st_mv"] = mediaPlayerVersion;
            }

            if (!labelMap.hasOwnProperty("ns_st_ub")) {

                labelMap["ns_st_ub"] = "0";
            }

            if (!labelMap.hasOwnProperty("ns_st_br")) {
                labelMap["ns_st_br"] = "0";
            }

            if (!labelMap.hasOwnProperty("ns_st_pn")) {
                labelMap["ns_st_pn"] = "1";
            }

            if (!labelMap.hasOwnProperty("ns_st_tp")) {
                labelMap["ns_st_tp"] = "1";
            }

            if (!labelMap.hasOwnProperty("ns_st_it")) {
                labelMap["ns_st_it"] = "c";
            }

            labelMap["ns_st_sv"] = StreamSenseConstants.STREAMSENSE_VERSION;

            labelMap["ns_type"] = "hidden"; // EventType.HIDDEN;

            return labelMap;
        }

        function createLabels(eventType, initialLabels) {
            var labelMap = initialLabels || {};

            labelMap["ns_st_ec"] = String(nextEventCount);
            if (!labelMap.hasOwnProperty("ns_st_po")) {
                var currentPosition = lastKnownPosition;
                var eventTime = getTime(labelMap);
                if (eventType == StreamSenseEventType.PLAY || eventType == StreamSenseEventType.KEEP_ALIVE || eventType == StreamSenseEventType.HEART_BEAT || (eventType == null && currentState == State.PLAYING)) {
                    currentPosition += eventTime - playlist.getClip().getPlaybackTimestamp();
                }
                labelMap["ns_st_po"] = String(currentPosition);
            }

            if (eventType == StreamSenseEventType.HEART_BEAT) {
                labelMap["ns_st_hc"] = String(heartBeatCount);
            }

            return labelMap;
        }

        function fixEventTime(eventLabelMap) {
            var time = getTime(eventLabelMap);

            if (time < 0) {
                eventLabelMap["ns_ts"] = String(+new Date());
            }
        }

        Utils.extend(this, {
            reset: function(keepLabels) {
                playlist.reset(keepLabels);
                playlist.setPlaylistCounter(0);
                playlist.setPlaylistId(+new Date() + "_1");
                playlist.getClip().reset(keepLabels);

                if (keepLabels != null && !keepLabels.isEmpty()) {
                    Utils.filterMap(persistentLabelMap, keepLabels);
                } else {
                    persistentLabelMap = {};
                }

                nextEventCount = 1;
                heartBeatCount = 0;
                pauseHeartBeatTimer();
                resetHeartBeatTimer();
                stopKeepAliveTimer();
                stopPausedOnBufferingTimer();
                stopDelayedTransitionTimer();
                currentState = State.IDLE;
                lastStateChangeTimestamp = -1;
                lastStateWithMeasurement = null;
                mediaPlayerName = StreamSenseConstants.DEFAULT_PLAYERNAME;
                mediaPlayerVersion = StreamSenseConstants.STREAMSENSE_VERSION;
                measurementSnapshot = null;
            },

            notify: function() {
                var newState
                    , eventType
                    , eventLabelMap
                    , position

                eventType = arguments[0];
                if (arguments.length == 3) {
                    eventLabelMap = arguments[1];
                    position = arguments[2];
                } else {
                    eventLabelMap = {};
                    position = arguments[1];
                }

                newState = eventTypeToState(eventType);

                var dispatchLabels = Utils.extend({}, eventLabelMap);
                fixEventTime(dispatchLabels);

                if (!dispatchLabels.hasOwnProperty("ns_st_po")) {
                    dispatchLabels["ns_st_po"] = String(position);
                }

                if (eventType == StreamSenseEventType.PLAY || eventType == StreamSenseEventType.PAUSE || eventType == StreamSenseEventType.BUFFER
                        || eventType == StreamSenseEventType.END) {
                    if (self.isPausePlaySwitchDelayEnabled() && canTransitionTo(newState) && isPlayOrPause(currentState) && isPlayOrPause(newState)) {
                        transitionTo(newState, dispatchLabels, StreamSenseConstants.PAUSE_PLAY_SWITCH_DELAY);
                    } else {
                        transitionTo(newState, dispatchLabels);
                    }
                } else {
                    var labels = createMeasurementLabels(eventType, dispatchLabels);
                    Utils.extend(labels, dispatchLabels);
                    dispatch(labels, false);
                    nextEventCount++;
                }
            },

            getLabels: function() {
                return persistentLabelMap;
            },

            setLabels: function(labelMap) {
                if (labelMap != null) {
                    if (persistentLabelMap == null) {
                        persistentLabelMap = labelMap;
                    } else {
                        Utils.extend(persistentLabelMap, labelMap);
                    }
                }
            },

            getLabel: function(name) {
                return persistentLabelMap[name];
            },

            setLabel: function(name, value) {
                if (value == null) {
                    delete persistentLabelMap[name];
                } else {
                    persistentLabelMap[name] = value;
                }
            },

            setPixelURL: function(value) {
                if (value == null || value.length == 0) {
                    return null;
                }

                var questionMarkIdx = value.indexOf('?');
                if (questionMarkIdx >= 0) {
                    if (questionMarkIdx < value.length - 1) {
                        var labels = value.substring(questionMarkIdx + 1).split("&");
                        for (var i = 0, len = labels.length; i < len; i++) {
                            var label = labels[i];
                            var pair = label.split("=");
                            if (pair.length == 2) {
                                self.setLabel(pair[0], pair[1]);
                            } else if (pair.length == 1) {
                                self.setLabel(StreamSenseConstants.PAGE_NAME_LABEL, pair[0]);
                            }
                        }
                        value = value.substring(0, questionMarkIdx + 1);
                    }
                } else {
                    value = value + '?';
                }
                pixelURL = value;

                return pixelURL;
            },

            getPixelURL: function() {
                if (pixelURL) {
                    return pixelURL;
                } else if (typeof ns_p !== 'undefined' && typeof ns_p.src === 'string') {
                    return (pixelURL = ns_p.src.replace(/&amp;/, '&').replace(/&ns__t=\d+/, ''));
                } else if (typeof ns_pixelUrl === 'string') {
                    return pixelURL.replace(/&amp;/, '&').replace(/&ns__t=\d+/, '');
                }

                return null;
            },

            isPersistentLabelsShared: function() {
                return sdkPersistentLabelsSharing;
            },

            setPersistentLabelsShared: function(flag) {
                sdkPersistentLabelsSharing = flag;
            },

            isPauseOnBufferingEnabled: function() {
                return pauseOnBufferingEnabled;
            },

            setPauseOnBufferingEnabled: function(flag) {
                pauseOnBufferingEnabled = flag;
            },

            isPausePlaySwitchDelayEnabled: function() {
                return pausePlaySwitchDelayEnabled;
            },

            setPausePlaySwitchDelayEnabled: function(flag) {
                pausePlaySwitchDelayEnabled = flag;
            },

            setClip: function(labels, loop) {
                if (currentState == State.IDLE) {
                    playlist.getClip().reset();
                    playlist.getClip().setLabels(labels, null);
                    if (loop) {
                        playlist.incrementStarts();
                    }
                }
            },

            setPlaylist: function(labels) {
                if (currentState == State.IDLE) {
                    playlist.incrementPlaylistCounter();
                    playlist.reset();
                    playlist.getClip().reset();
                    playlist.setLabels(labels, null);
                }
            },

            importState: function(labels) {
                reset();
                var rest = Utils.extend({}, labels);
                playlist.setRegisters(rest, null);
                playlist.getClip().setRegisters(rest, null);
                setRegisters(rest);
                nextEventCount++;
            },

            exportState: function() {
                return measurementSnapshot;
            },

            getVersion: function() {
                return StreamSenseConstants.STREAMSENSE_VERSION;
            },

            addListener: function(listener) {
                listenerList.push(listener);
            },

            removeListener: function(listener) {
                listenerList.splice(listenerList.indexOf(listener), 1);
            },

            getClip: function() {
                return playlist.getClip();
            },

            getPlaylist: function() {
                return playlist;
            }
        });

        if ('streamsense.js' == 'streamsense.test.js') {
            Utils.extend(this, {
                dispatch: dispatch,
                sendHeartBeatMeasurement: dispatchHeartBeatEvent,
                sendKeepAliveMeasurement: dispatchKeepAlive
            });
        }

/**
 * The advertisement events API. Ad events can also be passed to the
 * notify() method and they will be redirected here.
 * @public
 * @param {ns_.StreamSense.AdEvent} adEvent
 * @param {Object} [eventLabels]
 * @param {Number} [playheadPosition]
 */
function adNotify(adEvent, eventLabels, playheadPosition) {
    eventLabels = eventLabels || {};
    eventLabels.ns_st_ad = 1;

    if (adEvent >= StreamSenseEventType.AD_PLAY && adEvent <= StreamSenseEventType.AD_CLICK) {
        self.notify(adEvent, eventLabels, playheadPosition);
    }
}

/**
 * Custom events notification API.
 * @public
 * @param {Object} [eventLabels]
 * @param {Number} [playheadPosition]
 */
function customNotify(eventLabels, playheadPosition) {
    self.notify(StreamSenseEventType.CUSTOM, eventLabels, playheadPosition);
}

Utils.extend(this, {
    adNotify: adNotify,
    customNotify: customNotify,
    viewNotify: function(pixelUrl, labels) {
        pixelUrl = pixelUrl || self.getPixelURL();
        if (pixelUrl) {
            viewNotify(pixelUrl, labels) // defined in streamsense.dom.js and streamsense.nondom.js
        }
    }
});


        if (ns_.comScore) {
            exports = ns_.comScore.exports;
            core = exports.c();
        }
        persistentLabelMap = {};
        nextEventCount = 1;
        currentState = State.IDLE;
        playlist = new Playlist();
        pausedOnBufferingTimer = null;
        pauseOnBufferingEnabled = true;
        heartBeatTimer = null;
        heartBeatCount = 0;
        resetHeartBeatTimer();
        keepAliveTimer = null;
        delayedTransitionTimer = null;
        pausePlaySwitchDelayEnabled = false;
        lastStateWithMeasurement = null;
        lastKnownPosition = 0;
        listenerList = [];
        self.reset();

        aLabels && self.setLabels(aLabels);
        aPixelURL && self.setPixelURL(aPixelURL);
    };

/*
 * The static API for the Stream Sense Puppet is not exactly static. The
 * anonymous function is used to wrap instance data held by this API.
 */
(function(constructor) {
    var
        /**
         * All puppet instances.
         * @private
         */
        _instances = {}
        /**
         * Non-reusable index.
         * @private
         */
        , _lastIndex = -1
        /**
         * Active puppet index, all calls are redirected to this instance.
         * @private
         */
        , _activeIndex = -1


    /**
     * Get the active instance or create one if it doesn't exist.
     * @param {String|Object} [pixelUrl|labels]
     * @param {Obect} [labels]
     * @returns {ns_.StreamSense}
     */
    function _activeInstance (pixelUrl, labels) {
        return _instances[_activeIndex] || newInstance(pixelUrl, labels);
    }

    /**
     * Set the active index to the first available instance and update the
     * class value.
     * @returns {Number} active index
     */

    function _updateActiveIndex() {
        _activeIndex = -1;

        for (var i = 0; i <= _lastIndex; i++) {
            if (_instances.hasOwnProperty(i)) {
                _activeIndex = i;
                break; //-->
            }
        }

        ns_.StreamSense.activeIndex = _activeIndex;

        return _activeIndex;
    }

    /**
     * Create a new puppet instance.
     * @memberOf ns_.StreamSense
     * @param {String|Object} [pixelUrl|labels]
     * @param {Obect} [labels]
     * @returns {ns_.StreamSense}
     */
    function newInstance(pixelUrl, labels) {
        pixelUrl = pixelUrl || null;
        labels = labels || null;

        if (pixelUrl && typeof pixelUrl == 'object') {
            labels = pixelUrl;
            pixelUrl = null;
        }

        _instances[++_lastIndex] = new ns_.StreamSense(labels, pixelUrl);
        _updateActiveIndex();

        return _instances[_lastIndex];
    }

    /**
     * Remove the puppet instance from the instances list. If no arguments are
     * mentioned, the active puppet will be removed. If a numeric
     * argument is specified, the instance with the given index is removed. If
     * a ns_StreamSense argument is specified, that specific instance
     * will be removed.
     * @param {empty|Number|ns_.StreamSense}
     * @returns {false|ns_.StreamSense} false if the operation didn't
     * succeed
     */
    function destroyInstance (/** empty|index|puppet */) {
        var
            instance = false
            , index = _activeIndex // default to current instance


        if (typeof arguments[0] === 'number' && isFinite(arguments[0])) {
            index = arguments[0];
        } else if (arguments[0] instanceof ns_.StreamSense) {
            for (var i in _instances) {
                if (_instances[i] === arguments[0]) {
                    index = i;
                    break; //-->
                }
            }
        }

        if (_instances.hasOwnProperty(index)) {
            instance = _instances[index];
            delete _instances[index];
            instance.reset(); // end session
            _updateActiveIndex();
        }

        return instance;
    }

    /**
     * Create a new playlist instance for the current puppet instance.
     * @memberOf ns_.StreamSense
     * @param {Object} labels
     * @returns {ns_.StreamSense#Playlist}
     */
    function newPlaylist (labels) {
        labels = labels || {};
        _activeInstance().setPlaylist(labels);
        return _activeInstance().getPlaylist();
    }

    /**
     * Create a new clip instance for the current puppet. If the puppet is not
     * created it will be.
     * @memberOf ns_.StreamSense
     * @param {Object} [labels]
     * @param {Number} [clipNumber]
     * @param {Boolean} isLoop
     * @returns {ns_.StreamSense#Clip}
     */
    function newClip (labels, clipNumber, isLoop) {
        labels = labels || {};
        if (typeof clipNumber === 'number') {
            labels.ns_st_cn = clipNumber;
        }

        _activeInstance().setClip(labels, isLoop);

        return _activeInstance().getClip();
    }

    /**
     * Main API for player and ad events notifications.
     * @memberOf ns_.StreamSense
     * @param {ns_.StreamSense.PlayerEvents|ns_.StreamSense.AdEvents} event
     * @param {Object} [labels]
     * @param {Number} [playheadPosition]
     * @returns {ns_.StreamSense.PlayerStates}
     */
    function notify(event, labels, playheadPosition) {
        if (typeof event === 'undefined') {
            return false; //-->
        }

        playheadPosition = playheadPosition || null;
        labels = labels || {};

        return _activeInstance().notify(event, labels, playheadPosition);
    }

    /**
     * Set puppet labels.
     * @memberOf ns_.StreamSense
     * @param {Object} labels
     */
    function setLabels(labels) {
        if (typeof labels != 'undefined') {
            _activeInstance().setLabels(labels);
        }
    }

    /**
     * Get puppet custom labels.
     * @memberOf ns_.StreamSense
     * @returns {Object}
     */
    function getLabels() {
        return _activeInstance().getLabels();
    }

    /**
     * Set playlist labels. Custom labels are not persisted, they
     * need to be sent with each event.
     * @memberOf ns_.StreamSense
     * @param {Object} labels
     */
    function setPlaylistLabels (labels) {
        if (typeof labels != 'undefined') {
            _activeInstance().getPlaylist().setLabels(labels);
        }
    }

    /**
     * Get playlist custom labels.
     * @memberOf ns_.StreamSense
     * @returns {Object}
     */
    function getPlaylistLabels() {
        return _activeInstance().getPlaylist().getLabels();
    }

    /**
     * Set clip labels. Custom labels are not persisted, they
     * need to be sent with each event.
     * @memberOf ns_.StreamSense
     * @param {Object} labels
     */
    function setClipLabels (labels) {
        if (typeof labels != 'undefined') {
            _activeInstance().getClip().setLabels(labels);
        }
    }

    /**
     * Get clip custom labels.
     * @memberOf ns_.StreamSense
     * @returns {Object}
     */
    function getClipLabels() {
        return _activeInstance().getClip().getLabels();
    }

    /**
     * Reset the Puppet counters. Not including playlist and clip.
     * @memberOf ns_.StreamSense
     * @param {Object} [skipLabels] counters not to be reset.
     * @returns {ns_.StreamSense} self
     */
    function resetInstance (skipLabels) {
        return _activeInstance().reset(skipLabels || {});
    }

    /**
     * Reset the playlist counters. Not including clip.
     * @memberOf ns_.StreamSense
     * @param {Object} [skipLabels] counters not to be reset.
     * @returns {ns_.StreamSense#Playlist} self
     */
    function resetPlaylist (skipLabels) {
        return _activeInstance().getPlaylist().reset(skipLabels || {});
    }

    /**
     * Reset the clip counters.
     * @memberOf ns_.StreamSense
     * @param {Object} [skipLabels] counters not to be reset.
     * @returns {ns_.StreamSense#Clip} self
     */
    function resetClip (skipLabels) {
        return _activeInstance().getClip().reset(skipLabels || {});
    }

    /**
     * Send a page view event.
     * @memberOf ns_.StreamSense
     * @param {Object} [labels]
     * TODO Custom pixelUrl?
     */
    function viewEvent (labels) {
        labels = labels || {};
        return _activeInstance().viewNotify(null, labels);
    }

    /**
     * Send a custom event. This doesn't affect the puppet state.
     * @memberOf ns_.StreamSense
     * @param {Object} labels
     * @param {Number} [playheadPosition]
     */
    function customEvent (labels, playheadPosition) {
        if (arguments.length > 2) { // for backward compatibility
          labels = arguments[1];
          playheadPosition = arguments[2];
        }
        labels = labels || {};
        if (typeof playheadPosition == 'number') {
            labels.ns_st_po = playheadPosition;
        }
        return _activeInstance().customNotify(labels, playheadPosition);
    }

    /**
     * Exports the current puppet state.
     * @public
     * @returns {Object} Snapshot of the state.
     */
    function exportState() {
      return _activeInstance().exportState();
    }

    /**
     * Imports a puppet state from the provided object.
     * @public
     * @param {Object} [state] Object containing labels snapshot.
     * @param {Number} [playheadPosition]
     */
    function importState(state) {
      _activeInstance().importState(state);
    }

    Utils.extend(constructor, {
        activeIndex: _activeIndex,
        newInstance: newInstance,
        'new': newInstance,
        destroyInstance: destroyInstance,
        destroy: destroyInstance, // alias
        newPlaylist: newPlaylist,
        newClip: newClip,
        notify: notify,
        setLabels: setLabels,
        getLabels: getLabels,
        setPlaylistLabels: setPlaylistLabels,
        getPlaylistLabels: getPlaylistLabels,
        setClipLabels: setClipLabels,
        getClipLabels: getClipLabels,
        resetInstance: resetInstance,
        resetPlaylist: resetPlaylist,
        resetClip: resetClip,
        viewEvent: viewEvent,
        customEvent: customEvent,
        exportState: exportState,
        importState: importState
    });
})(StreamSense);

    return StreamSense;
})();

StreamSense.AdEvents = AdEvents;
StreamSense.PlayerEvents = StreamSenseEventType;

/*** Addition by BBC START ***/
StreamSense._BBCSetHttpGet = function(f){
    httpGet = f;
};
/*** Addition by BBC END ***/

    return StreamSense;
})();

/*** Addtion by BBC START ***/
return ns_.StreamSense;
});
/*** Addition by BBC END ***/

;
/**
 * This module is meant as a replacement for comScore's UDM tag
 * It extends the udm by:
 *  - adding the option to define the httpGet method
 *  - managing persistant labels
 */

/**
 * TODO
 * * Tests
 * * "comScore=" cookie
 */

define( 'echo/delegate/comscore/app-tag',[],function(){
    


    function AppTag(url,customHttpGet,isApp){
        // init persistant labels
        this._persistantLabels = { };
        this._url = AppTag._makeBaseUrl(url);
        this._httpGet = customHttpGet;
        this._eventCount = 0;
        this._isApp = isApp;
    }

    AppTag.URL_LIMIT = 2048;

/** Public **/
    /**
     * Set persistant Labels
     */
    AppTag.prototype.addLabels = function(labels){
        for( var k in labels ){
            this._persistantLabels[k] = labels[k];
        }
    };
    /**
     * Set single persistant label
     */
    AppTag.prototype.addLabel = function(key,val){
        this._persistantLabels[key] = val;
    };
    /**
     * Delete persistant Labels
     */
    AppTag.prototype.removeLabels = function(keys){
        for(var i in keys){
            if(typeof this._persistantLabels[keys[i]] !== 'undefined'){
                delete this._persistantLabels[keys[i]];
            }
        }
    };

    /**
     * Send an event,
     * type should be "hidden" or "view"
     */
    AppTag.prototype.send = function(type,eventLabels,callback){
        var pLabels = this._persistantLabels,
            allLabels = {},
            finalUrl,
            k;
        this._eventCount++;

        for(k in pLabels){
            allLabels[k] = pLabels[k];
        }
        for(k in eventLabels){
            allLabels[k] = eventLabels[k];
        }
        allLabels.ns_type = type;
        if(this._isApp){ // ECHO-56
            allLabels.ns_ap_ev = type;
            allLabels.ns_ap_ec = this._eventCount;
        }
        // ECHO-56
        allLabels[this._isApp?'ns_ts':'ns__t'] = (+new Date());

        finalUrl = this._createUrl(allLabels);
        //if (typeof window.ns_p === 'undefined') {
            //window.ns_p = { src: finalUrl };
        //}
        this._httpGet(finalUrl,callback);
    };

/** Private **/

    /**
     * Turn kv pairs (in an object) into a url param string
     * if the string is to exceed limit, the params are
     * encoded and added against the "ns_cut=" key
     */
    AppTag.prototype._createUrl = function(params){
        var url = this._url,
            encode = window.encodeURIComponent || escape,
            limit = AppTag.URL_LIMIT -8, // Allow for the "ns_cut="
            cut = '',
            kv, k;

        for (k in params){
            kv = encode(k)+"="+encode(params[k])+"&";
            if( (url.length + kv.length ) < limit){
                url += kv;
            } else {
                cut += kv;
            }
        }
        if(cut.length){
            url += 'ns_cut='+encode(cut.replace(/&$/,''));
        } else{
            url = url.replace(/&$/, '');
        }
        return url;
    };

    /**
     * If the url does not have a trailing '?' or '&', add one
     */
    AppTag._makeBaseUrl = function(url){
        var mark = -1,
            last = url.charAt(url.length-1);
        for(var i=0,j=url.length;i<j;i++){
            if(url.charAt(i) === '?'){
                mark = i;
            }
        }
        if( mark === -1){
            url += '?';
        } else if (last !== '?' && last !== '&'){
            url += '&';
        }
        return url;
    };


   return AppTag;
});





define( 'echo/delegate/comscore/comscore-delegate',['require','../../util/helper','./label-keys','../../config/keys','../../environment','../../util/methods','../../enumerations','./streamsense-bbc','./app-tag'],function(require){
    

    var Helper = require('../../util/helper'),
        CSLabelKeys = require('./label-keys'),
        ConfigKeys = require('../../config/keys'),
        Environment = require('../../environment'),
        Utils = require('../../util/methods'),
        Enums = require('../../enumerations');

    var WEB_TYPES = [ Enums.ApplicationType.WEB,
                      Enums.ApplicationType.MOBILE_WEB,
                      Enums.ApplicationType.RESPONSIVE ];

    function dummy(){return -1;}

    function ComScoreDelegate(appName,appType,config,environment){

        this.SSPlayerEvent = ComScoreDelegate.StreamSense.PlayerEvents;

        var customGet = environment.getHttpGet();
        if(customGet){
            ComScoreDelegate.StreamSense._BBCSetHttpGet(customGet);
        }

        var endpoint = config[ConfigKeys.COMSCORE.URL];

        // Are we an App (as ComScore defines it, which is, not a web page (ECHO-56)?
        this._isApp = !Utils.containsValue(WEB_TYPES,appType);

        // Save the two CS objects
        this.appTag = new ComScoreDelegate.AppTag(endpoint,
                customGet || Environment._defaultHttpGet, this._isApp);
        this.ss = new ComScoreDelegate.StreamSense({},endpoint);



        this.addLabel(CSLabelKeys.BBC_APPLICATION_NAME, appName);
        this.addLabel(CSLabelKeys.BBC_APPLICATION_TYPE, appType);
        this.addLabel(CSLabelKeys.BBC_MEASUREMENT_LIB_NAME,config[ConfigKeys.ECHO.NAME]);
        this.addLabel(CSLabelKeys.BBC_MEASUREMENT_LIB_VERSION,config[ConfigKeys.ECHO.VERSION]);

        // Labels to set for "Apps" only
        if(this._isApp){
            this.addLabel(CSLabelKeys.APP_NAME, appName);
            this.addLabel(CSLabelKeys.APP_PLATFORM_NAME,environment.getPlatformName());
            this.addLabel(CSLabelKeys.APP_PLATFORM_RUNTIME,environment.getPlatformRuntimeEnvironment());
            this.addLabel(CSLabelKeys.APP_OS_VERSION,environment.getPlatformOSVersion());
            this.addLabel(CSLabelKeys.APP_DEVICE_NAME,environment.getDeviceName());
            this.addLabel(CSLabelKeys.APP_SCREEN_RESOLUTION,environment.getScreenResolution());
            this.addLabel(CSLabelKeys.APP_LANGUAGE,environment.getLanguage());
        } else {
            this.addLabel(CSLabelKeys.WEB_SCREEN_RES,environment.getScreenResolution());
        }
        this.addLabel(CSLabelKeys.ENV_CHAR_SET,environment.getCharSet());
        this.addLabel(CSLabelKeys.ENV_TITLE,environment.getTitle());
        this.addLabel(CSLabelKeys.ENV_URL,environment.getURL());
        this.addLabel(CSLabelKeys.ENV_REFERRER,environment.getReferrer());

        if(config[ConfigKeys.ECHO.TRACE]){
            this.addLabel(CSLabelKeys.ECHO_TRACE,config[ConfigKeys.ECHO.TRACE]);
        }


        this._mediaIsLive = null;
    }

    ComScoreDelegate.StreamSense = require('./streamsense-bbc');
    ComScoreDelegate.AppTag = require('./app-tag');

    /*
     * ------------------------------------------------------------------------
     * Application State Methods
     * ------------------------------------------------------------------------
     */

    ComScoreDelegate.prototype.addLabels = function(labels) {
        this.appTag.addLabels(labels);
        this.ss.setLabels(labels);
    };

    ComScoreDelegate.prototype.addLabel = function(key, value) {
        this.appTag.addLabel(key,value);
        this.ss.setLabel(key,value);
    };

    ComScoreDelegate.prototype.removeLabels = function(keys) {
        this.appTag.removeLabels(keys);
        for(var i in keys){
            this.ss.setLabel(keys[i],null);
        }
    };

    ComScoreDelegate.prototype.removeLabel = function(key) {
        this.appTag.removeLabels([key]);
        this.ss.setLabel(key,null);
    };

    ComScoreDelegate.prototype.optOutOfCookies = function(){
        this.addLabel(CSLabelKeys.NO_COOKIES,'1');
    };
    ComScoreDelegate.prototype.setAppVersion = function(version){
        if(this._isApp){
            this.addLabel(CSLabelKeys.APP_VERSION,version);
        }
    };
    ComScoreDelegate.prototype.setCounterName = function(name){
        this.addLabel(CSLabelKeys.BBC_COUNTER_NAME,name);
    };
    ComScoreDelegate.prototype.setContentLanguage = function(language){
        this.addLabel(CSLabelKeys.BBC_LANGUAGE,language);
    };


    ComScoreDelegate.prototype.setDeviceID = function(id){
        this.addLabel(CSLabelKeys.DEVICE_ID,id);
    };

    /*
     * ------------------------------------------------------------------------
     * Basic Analytics Methods
     * ------------------------------------------------------------------------
     */

    ComScoreDelegate.prototype.viewEvent = function(counterName, eventLabels) {
        /*
         * Set countername as a persistent label so it's included on all
         * subsequent events.
         */
        this.addLabel(CSLabelKeys.BBC_COUNTER_NAME,counterName);
        Utils.extend(eventLabels,false,CSLabelKeys.ECHO_EVENT_NAME,'view');
        this.appTag.send('view',eventLabels);
    };

    ComScoreDelegate.prototype.errorEvent = dummy;

    ComScoreDelegate.prototype.userActionEvent = function(actionType, actionName, eventLabels) {
        Utils.extend(eventLabels,false,
            CSLabelKeys.USER_ACTION_TYPE, actionType,
            CSLabelKeys.USER_ACTION_NAME, actionName,
            CSLabelKeys.ECHO_EVENT_NAME, 'userAct');
        // User action events are transmitted as a 'hidden' event.
        this.appTag.send('hidden',eventLabels);
    };

    /*
     * ------------------------------------------------------------------------
     * Media Player Attributes
     * ------------------------------------------------------------------------
     */

    /**
     * Media player information converted to Application i.e. Persistent labels
     * on Stream Sense. Included in all measurement events sent
     */
    ComScoreDelegate.prototype.setPlayerName = function(name) {
        this.ss.setLabel(CSLabelKeys.PLAYER_NAME, name);
    };

    ComScoreDelegate.prototype.setPlayerVersion = function(version) {
        this.ss.setLabel(CSLabelKeys.PLAYER_VERSION, version);
    };

    ComScoreDelegate.prototype.setPlayerIsPopped = function(isPopped) {
        this.ss.setLabel(CSLabelKeys.PLAYER_POPPED, isPopped?1:0);
    };

    ComScoreDelegate.prototype.setPlayerWindowState = function(windowState) {
        this.ss.setLabel(CSLabelKeys.PLAYER_WINDOW_STATE, windowState);
    };

    ComScoreDelegate.prototype.setPlayerVolume = function(volume) {
        this.ss.setLabel(CSLabelKeys.PLAYER_VOLUME, volume);
    };

    ComScoreDelegate.prototype.setPlayerIsSubtitled = function(isSubtitled) {
        this.ss.setLabel(CSLabelKeys.PLAYER_SUBTITLED, isSubtitled?1:0);
    };

    /*
     * ------------------------------------------------------------------------
     * Media Attributes
     * ------------------------------------------------------------------------
     */
    ComScoreDelegate.prototype.setMedia = function(media){
        // Create a new playlist with a new clip
        var playlist = {};
        var clip = {};
        var codec = media.getCodec();
        var cdn = media.getCDN();

        // Playlist labels:
        playlist[CSLabelKeys.PLAYLIST_NAME]       = media.getContentId();
        playlist[CSLabelKeys.PLAYLIST_CLIP_COUNT] = 1;
        playlist[CSLabelKeys.PLAYLIST_LENGTH]     = media.getLength();

        // Put the playlist on StreamSense
        this.ss.setPlaylist(playlist);

        // Clip labels:
        clip[CSLabelKeys.MEDIA_CLIP_NUMBER]        = 1;
        clip[CSLabelKeys.MEDIA_PART_NUMBER]        = 1;
        clip[CSLabelKeys.MEDIA_TOTAL_PARTS]        = 1;
        clip[CSLabelKeys.MEDIA_LENGTH]             = media.getLength();
        clip[CSLabelKeys.MEDIA_MEDIUM]             = media.getAvType();
        clip[CSLabelKeys.MEDIA_FORM]               = media.getForm();  // May be null
        clip[CSLabelKeys.MEDIA_RETRIEVAL_TYPE]     = media.getRetrievalType();
        clip[CSLabelKeys.MEDIA_BITRATE]            = media.getBitrate()*1000;

        if (codec !== null) {
            clip[CSLabelKeys.MEDIA_CODEC] = codec;
        }

        if (cdn !== null) {
            clip[CSLabelKeys.MEDIA_CDN] = cdn;
        }

        // contentID is either clip or episode id
        clip[CSLabelKeys.MEDIA_PID]                = media.getContentId();
        clip[CSLabelKeys.MEDIA_VERSION_ID]         = media.getVersionId();

        if(media.getServiceId()){
            clip[CSLabelKeys.MEDIA_SERVICE_ID]         = media.getServiceId();
        }
        switch(media.getScheduleMode()){ //dont set if null
            case Enums.EchoScheduleMode.ON:
                clip[CSLabelKeys.MEDIA_SCHEDULE_INDICATOR] = "on";
                break;
            case Enums.EchoScheduleMode.OFF:
                clip[CSLabelKeys.MEDIA_SCHEDULE_INDICATOR] = "off";
        }

        clip[CSLabelKeys[
            media.isEpisode()?'MEDIA_EPISODE_ID':'MEDIA_CLIP_ID']] = media.getContentId();




        if (media.isOnDemand()) {
            //On Demand Media
            clip[CSLabelKeys.MEDIA_STREAM_TYPE] = media.isVideo()?"vod":"aod";
            clip[CSLabelKeys.MEDIA_LIVE_OR_ONDEMAND] = 'on-demand';
            this._mediaIsLive = false;
        } else {
            //Live media
            clip[CSLabelKeys.MEDIA_STREAM_TYPE] = "live";
            clip[CSLabelKeys.MEDIA_IS_LIVE]  = 1;
            clip[CSLabelKeys.MEDIA_LIVE_OR_ONDEMAND] = 'live';

            this._mediaIsLive = true;

        }

        // Put the clip on StreamSense
        this.ss.setClip(clip);
    };

    ComScoreDelegate.prototype.setMediaLength  = function(length) {
        // Length defined on playlist
        this.ss.getPlaylist().setLabel(CSLabelKeys.PLAYLIST_LENGTH, length);

        // Length defined on clip
        this.ss.getClip().setLabel(CSLabelKeys.MEDIA_LENGTH, length);
    };

    ComScoreDelegate.prototype.setMediaBitrate = function(bitrate) {
        // Echo askes for kilobits, comScore needs bits
        bitrate*=1000;
        //No zero check needed as Echo client will not delegate if zero
        this.ss.getClip().setLabel(CSLabelKeys.MEDIA_BITRATE, bitrate);
    };



    /*
     * ------------------------------------------------------------------------
     * Media Events
     * ------------------------------------------------------------------------
     */

    ComScoreDelegate.prototype.avPlayEvent = function(position, eventLabels) {
        Utils.extend(eventLabels,false,CSLabelKeys.ECHO_EVENT_NAME,'avPlay');
        this.ss.notify(this.SSPlayerEvent.PLAY, eventLabels, this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avPauseEvent = function(position, eventLabels) {
        Utils.extend(eventLabels,false,CSLabelKeys.ECHO_EVENT_NAME,'avPause');
        this.ss.notify(this.SSPlayerEvent.PAUSE, eventLabels, this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avBufferEvent = function(position, eventLabels) {
        // Dont pass in buffer event, becuse comscore does nothing with them
        this.ss.notify(this.SSPlayerEvent.BUFFER, {}, this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avEndEvent = function(position, eventLabels) {
        Utils.extend(eventLabels,false,
                CSLabelKeys.ECHO_EVENT_NAME,    'avEnd',
                CSLabelKeys.PLAYLIST_END,       1);
        this.ss.notify(this.SSPlayerEvent.END,eventLabels,this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avRewindEvent = function(position, rate, eventLabels) {
        /*
         * We assume rewind, ff and seek are always user interaction triggered.
         * See Pg 18 StreamSense docs.
         */
        Utils.extend(eventLabels,false,
                CSLabelKeys.ECHO_EVENT_NAME,    'avRW',
                CSLabelKeys.EVENT_TRIGGERED_BY_USER, "rewind",
                CSLabelKeys.REWIND_FF_RATE, rate);

        // Comscore require a pause when the content stops playing
        this.ss.notify(this.SSPlayerEvent.PAUSE, eventLabels, this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avFastForwardEvent = function(position, rate, eventLabels) {
        /*
         * We assume rewind, ff and seek are always user interaction triggered.
         * See Pg 18 StreamSense docs.
         */
        Utils.extend(eventLabels,false,
                CSLabelKeys.ECHO_EVENT_NAME,    'avFF',
                CSLabelKeys.EVENT_TRIGGERED_BY_USER, "fastforward",
                CSLabelKeys.REWIND_FF_RATE, rate);

        // Comscore require a pause when the content stops playing
        this.ss.notify(this.SSPlayerEvent.PAUSE, eventLabels, this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avSeekEvent = function(position, eventLabels) {
        /*
         * We assume rewind, ff and seek are always user interaction triggered.
         * See Pg 18 StreamSense docs.
         */
        Utils.extend(eventLabels,false,
                CSLabelKeys.ECHO_EVENT_NAME,    'avSeek',
                CSLabelKeys.EVENT_TRIGGERED_BY_USER, "seek");

        // Comscore require a pause when the content stops playing
        this.ss.notify(this.SSPlayerEvent.PAUSE, eventLabels, this._mediaIsLive?0:position);
    };

    ComScoreDelegate.prototype.avUserActionEvent = function(actionType, actionName, position, eventLabels) {

        var l = {};
        Utils.extend(eventLabels,false,
                CSLabelKeys.ECHO_EVENT_NAME, 'avUserAct',
                CSLabelKeys.STREAMSENSE_CUSTOM_EVENT_TYPE, actionType,
                CSLabelKeys.USER_ACTION_TYPE, actionType,
                CSLabelKeys.USER_ACTION_NAME, actionName);

        this.ss.customNotify(eventLabels, this._mediaIsLive?0:position);
    };


    return ComScoreDelegate;
});




define('echo/delegate/rum/label-keys',{

    COUNTERNAME : "cn",

    USER_ACTION_TYPE : 'uat',
    USER_ACTION_NAME : 'uan',
    USER_ACTION_EVENT : 'UA',

    MEDIA_PID : 'pid',
    MEDIA_TYPE : 'mt',
    MEDIA_ON_DEMAND : 'od',
    MEDIA_RETRIEVAL_TYPE : 'ret',
    MEDIA_LENGTH : 'len',
    MEDIA_BITRATE : 'br',
    MEDIA_CDN : 'cdn',
    MEDIA_POSITION : 'pos',

    AV_PLAY_EVENT : 'AVPL',
    AV_PAUSE_EVENT : 'AVPS',
    AV_BUFFER_EVENT : 'AVBF',
    AV_END_EVENT : 'AVEN',
    AV_FF_EVENT : 'AVFF',
    AV_RW_EVENT :'AVRW',
    AV_SEEK_EVENT : 'AVSK',
    AV_UA_EVENT : 'AVUA',

    ECHO_TRACE : 'trace'

});


/*! BBC RUM Client - v0.4.4 - 2014-01-08  Copyright (c) 2014 !*/

define("lib/json",["require"],function(e){var t={};return function(){function e(e){return e<10?"0"+e:e}function o(e){return n.lastIndex=0,n.test(e)?'"'+e.replace(n,function(e){var t=s[e];return typeof t=="string"?t:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+e+'"'}function u(e,t){var n,s,a,f,l=r,c,h=t[e];h&&typeof h=="object"&&typeof h.toJSON=="function"&&(h=h.toJSON(e));switch(typeof h){case"string":return o(h);case"number":return isFinite(h)?String(h):"null";case"boolean":case"null":return String(h);case"object":if(!h)return"null";r+=i,c=[];if(Object.prototype.toString.apply(h)==="[object Array]"){f=h.length;for(n=0;n<f;n+=1)c[n]=u(n,h)||"null";return a=c.length===0?"[]":r?"[\n"+r+c.join(",\n"+r)+"\n"+l+"]":"["+c.join(",")+"]",r=l,a}for(s in h)Object.prototype.hasOwnProperty.call(h,s)&&(a=u(s,h),a&&c.push(o(s)+(r?": ":":")+a));return a=c.length===0?"{}":r?"{\n"+r+c.join(",\n"+r)+"\n"+l+"}":"{"+c.join(",")+"}",r=l,a}}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+e(this.getUTCMonth()+1)+"-"+e(this.getUTCDate())+"T"+e(this.getUTCHours())+":"+e(this.getUTCMinutes())+":"+e(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf()});var n=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,r,i,s={"\b":"\\b"," ":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};typeof t.stringify!="function"&&(t.stringify=function(e){return u("",{"":e})})}(),t}),define("analytics_client",["require","./lib/json"],function(e){function t(n){this.events=[],this.labels={},this.dataLabels={},this._getCookie=n.custom_cookie_getter||this._getCookie,this._setCookie=n.custom_cookie_setter||this._setCookie,this.p=n.product||"_",this.e=n.edition||null,this.id2=this._getCookie(t.USER_COOKIE_NAME),this.posting=this._setDelivery(n.delivery_method,n.server,n.url_params,n.custom_delivery),this.limit_url=!this.posting,this.JSON=window.JSON||e("./lib/json")}return t.USER_COOKIE_NAME="s1",t.MAX_URL_LENGTH=2e3,t.SESSION_COOKIE_NAME="ckpf_rum_session",t.SESSION_COOKIE_TIMEOUT=18e5,t.RT_THRESHOLD=6e4,t.AJAX_POST=1,t.AJAX_GET=2,t.DOM_GET=3,t.CUSTOM_POST=4,t.CUSTOM_GET=5,t.LABELS={COUNT_CONTENT_ID:"ccid",COUNT_LIST_ID:"clid"},t.VERSION="0.4.4",t.prototype._setDelivery=function(e,n,r,i){var s,o,u;switch(e){case t.AJAX_POST:s=!0,o=!0,u=!1;break;case t.AJAX_GET:s=!1,o=!0,u=!1;break;case t.DOM_GET:s=!1,o=!1,u=!1;break;case t.CUSTOM_POST:s=!0,o=!1,u=!0;break;case t.CUSTOM_GET:s=!1,o=!1,u=!0;break;default:s=!0,o=!0,u=!1}return s&&typeof navigator=="object"&&navigator.platform&&(navigator.platform.indexOf("iPhone")!=-1||navigator.platform.indexOf("iPod")!=-1||navigator.platform.indexOf("iPad")!=-1)&&(s=!1),u?this._makeRequest=t._useCustomRequest(i,t._makeURL(s,n,r),s):o&&typeof XMLHttpRequest!="undefined"&&typeof (new XMLHttpRequest).withCredentials!="undefined"?this._makeRequest=t._useXMLHttpRequest(t._makeURL(s,n,r),s):(s=!1,this._makeRequest=t._useImageRequest(t._makeURL(!1,n,r))),s},t._makeURL=function(e,n,r){var i=e?"":"/legacy",s=n+i;return r?t._addParams(s,r):s},t._addParams=function(e,t){e.indexOf("?")===-1?e+="?":e.indexOf("?")!==e.length-1&&(e+="&");for(var n in t)e+=encodeURIComponent(n)+"="+encodeURIComponent(t[n])+"&";return e.replace(/(\?|&)$/,"")},t.prototype._addEvent=function(e,n,r){var i,s,o={},u={};for(i in this.dataLabels)o[i]=this.dataLabels[i];for(i in n)o[i]=n[i];for(i in this.labels)u[i]=this.labels[i];for(i in r)i===t.LABELS.COUNT_CONTENT_ID||i===t.LABELS.COUNT_LIST_ID?o[i]=r[i]:u[i]=r[i];s={cv:t.VERSION,p:this.p,id:e,id2:this.id2,sid:this._updateSessionID(),ts:(new Date).getTime(),l:u,data:o},this.e!==null&&(s.e=this.e),this.events.push(s)},t.prototype._getCookie=function(e){if(typeof document=="undefined"||typeof document.cookie!="string")return null;var t,n=document.cookie;if(n.indexOf(e+"=")===0)t=e.length+1;else{t=n.indexOf(" "+e+"=");if(t==-1)return null;t+=e.length+2}var r=n.indexOf(";",t);return r==-1&&(r=n.length),n.substring(t,r)},t.prototype._setCookie=function(e,t,n,r){if(!document||typeof document.cookie!="string")return;var i=new Date;i.setTime(i.getTime()+r);var s=i.toUTCString(),o=e+"="+t+";"+" expires="+s+";"+" path="+n+";";document.cookie=o},t.prototype._addEventAndSend=function(e,t,n,r){this._addEvent(e,t,n),this._sendEvents(r)},t._createPLData=function(){return{url:window.location.pathname,referrer:document.referrer}},t._createPTData=function(){if(typeof window.performance!="object")return null;var e={url:window.location.pathname};for(var t in window.performance.timing)typeof window.performance.timing[t]!="function"&&(e[t]=window.performance.timing[t]);e.navigationStart=e.navigationStart||e.redirectStart||e.fetchStart;var n=e.loadEventEnd,r=e.navigationStart,i=e.requestStart,s=e.responseEnd;return n&&r&&i&&s&&(e.plt=n-r,e.pre=i-r,e.req=s-i,e.pro=n-s),e},t._createRTData=function(e,n){if(window.performance&&window.performance.getEntriesByType){var r=t._cleanRTData(window.performance.getEntriesByType("resource"));return{url:window.location.pathname,plt:e,"long":n,res:r}}return null},t._cleanRTData=function(e){var t=[];for(var n=0,r=e.length;n<r;n++){t[n]={};for(var i in e[n])e[n][i]!==0&&(i==="name"?t[n][i]=e[n][i].replace(/\?.*$/,""):t[n][i]=e[n][i])}return t},t.prototype._sendEvents=function(e,n){var r=n,i,s;r||(r=this.events,this.events=[]),i=this.JSON.stringify({events:r});if(this.limit_url&&r.length>1&&i.length>t.MAX_URL_LENGTH)for(s=0;s<r.length;s++)this._sendEvents(e,[r[s]]);else this._makeRequest(e,i,{"Content-type":"application/json"})},t._useXMLHttpRequest=function(e,n){return function(r,i,s){var o,u=e;n||(u=t._addParams(u,{data:i})),o=new XMLHttpRequest,o.open(n?"POST":"GET",u,!0);for(var a in s)o.setRequestHeader(a,s[a]);o.onreadystatechange=function(){o.readyState==4&&r&&r(o.status)};try{o.send(i)}catch(f){}}},t._useImageRequest=function(e){function i(e,t){n.push(function(){var n=new Image;n.onload=function(){s(),typeof e=="function"&&e()},n.onerror=function(){s()},n.onabort=function(){s()},n.src=t}),o()}function s(){r=!1,o()}function o(){if(r||n.length<1)return;r=!0;var e=n.shift();e()}var n=[],r=!1;return function(n,r){var s=t._addParams(e,{data:r});i(n,s)}},t._useCustomRequest=function(e,n,r){return r?function(t,r,i){e(t,null,"POST",n,i,r)}:function(r,i,s){e(r,null,"GET",t._addParams(n,{data:i}),s)}},t.prototype.load=function(e,n){var r=this;r._addEvent("PL",t._createPLData(),e),setTimeout(function(){var i=t._createPTData(),s,o,u;if(i){r._addEvent("PT",i,e);if(n!==!1){o=i.plt,u=i.plt>t.RT_THRESHOLD;if(n||u)s=t._createRTData(i.plt,u),s&&(r.rtSent=!0,r._addEvent("RT",s,e))}}r._sendEvents()},0)},t.prototype.sendError=function(e,t,n,r){this._addEventAndSend("ERR",{m:e,file:t,line:n},r)},t.prototype.sendExit=function(e,t,n){this._addEventAndSend("EXIT",{s:e,d:t},n)},t.prototype.addLabels=function(e,t){for(var n in e)this.addLabel(n,e[n],t)},t.prototype.addLabel=function(e,t,n){this[n?"dataLabels":"labels"][e]=t},t.prototype.removeLabels=function(e){for(var t=0;t<e.length;t++)delete this.labels[e[t]]},t.prototype._generateSessionID=function(){return""+(new Date).getTime()+"-"+this.id2},t.prototype._updateSessionID=function(){var e=this._getCookie(t.SESSION_COOKIE_NAME)||this._generateSessionID();return this._setCookie(t.SESSION_COOKIE_NAME,e,"/",t.SESSION_COOKIE_TIMEOUT),e},{AC:t}});


define('echo/delegate/rum/rum-delegate',['require','./label-keys','../../config/keys','../../util/methods','analytics_client'],function(require){
    

    var Keys = require('./label-keys');
    var ConfigKeys = require('../../config/keys');
    var Utils = require('../../util/methods');

    //function to use when we are ignoring a function
    function dummy(){return -1;}

    function RumDelegate(appName,appType,config,env){

        var rumConf = {
            server:config[ConfigKeys.RUM.URL],
            product:appName
        };
        // Tell RUM to use the custom function if we have it
        var customGet = env.getHttpGet();
        if( customGet ){
            rumConf.delivery_method = RumDelegate.AC.CUSTOM_GET;
            rumConf.custom_delivery = function(onSuccess,onError,method,url,headers){
                customGet(url,headers,onSuccess,onError);
            };
        }
        if(env.getCookieGetter()){
            rumConf.custom_cookie_getter = env.getCookieGetter();
        }
        if(env.getCookieSetter()){
            rumConf.custom_cookie_setter = env.getCookieSetter();
        }

        this.ac = new RumDelegate.AC(rumConf);

        if(config[ConfigKeys.ECHO.TRACE]){
            this.ac.addLabel(Keys.ECHO_TRACE,config[ConfigKeys.ECHO.TRACE],true);
        }
    }

    RumDelegate.AC = require('analytics_client').AC;

    // Application State Methods
    RumDelegate.prototype.addLabels = function(labels){
        this.ac.addLabels(labels);
    };
    RumDelegate.prototype.addLabel = function(key,value){
        this.ac.addLabel(key,value);
    };
    RumDelegate.prototype.removeLabels = function(labels){
        this.ac.removeLabels(labels);
    };
    RumDelegate.prototype.removeLabel = function(key){
        this.ac.removeLabels([key]);
    };
    RumDelegate.prototype.setCounterName = function(name){
        this.ac.addLabel(Keys.COUNTERNAME,name,true);
    };

    RumDelegate.prototype.optOutOfCookies = dummy;
    RumDelegate.prototype.setAppVersion = dummy;
    RumDelegate.prototype.setContentLanguage = dummy;
    RumDelegate.prototype.setDeviceID = dummy;



    // Analytics Methods
    RumDelegate.prototype.viewEvent = function(countername,eventLabels){
        this.ac.addLabel(Keys.COUNTERNAME,countername,true);
        this.ac.load(eventLabels);
    };
    RumDelegate.prototype.errorEvent = function(error,labels){
        var description = error.name + ": " + error.message;
        this.ac.sendError(description,"",null,labels);
    };
    RumDelegate.prototype.userActionEvent = function(actionType,actionName,eventLabels){
        var dataLabels = Utils.extend({},false,
                    Keys.USER_ACTION_TYPE, actionType,
                    Keys.USER_ACTION_NAME, actionName );
        this.ac._addEventAndSend(Keys.USER_ACTION_EVENT,dataLabels,eventLabels);
    };


    // Media Player attributes
    RumDelegate.prototype.setPlayerName = dummy;
    RumDelegate.prototype.setPlayerVersion = dummy;
    RumDelegate.prototype.setPlayerIsPopped = dummy;
    RumDelegate.prototype.setPlayerWindowState = dummy;
    RumDelegate.prototype.setPlayerVolume = dummy;
    RumDelegate.prototype.setPlayerIsSubtitled = dummy;

    // Media Attributes
    RumDelegate.prototype.setMedia = function(media){
        this._mediaLabels = {};
        // Standard labels (should always be there)
        Utils.extend(this._mediaLabels,false,
                Keys.MEDIA_PID , media.getContentId(),
                Keys.MEDIA_TYPE, media.getAvType(),
                Keys.MEDIA_ON_DEMAND, media.isOnDemand,
                Keys.MEDIA_RETRIEVAL_TYPE, media.getRetrievalType(),
                Keys.MEDIA_LENGTH, media.getLength()
        );
        // Extra
        if(media.getBitrate()){
            this._mediaLabels[Keys.MEDIA_BITRATE] = media.getBitrate();
        }
        if(media.getCDN()){
            this._mediaLabels[Keys.MEDIA_CDN] = media.getCDN();
        }
    };
    RumDelegate.prototype.setMediaLength  = function(length){
        this._mediaLabels[Keys.MEDIA_LENGTH] = length;
    };
    RumDelegate.prototype.setMediaBitrate = function(bitrate){
        this._mediaLabels[Keys.MEDIA_BITRATE] = bitrate;
    };

    // Media Event
    RumDelegate.prototype.avPlayEvent = function(position,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_PLAY_EVENT,
                Utils.extend(this._mediaLabels,true,Keys.MEDIA_POSITION,position),
                eventLabels
        );
    };
    RumDelegate.prototype.avPauseEvent = function(position,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_PAUSE_EVENT,
                Utils.extend(this._mediaLabels,true,Keys.MEDIA_POSITION,position),
                eventLabels
        );
    };
    // We are skipping this one for the mo (NKDATA-416)
    RumDelegate.prototype.avBufferEvent = dummy;

    RumDelegate.prototype.avEndEvent = function(position,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_END_EVENT,
                Utils.extend(this._mediaLabels,true,Keys.MEDIA_POSITION,position),
                eventLabels
        );
    };
    RumDelegate.prototype.avRewindEvent = function(position,rate,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_RW_EVENT,
                Utils.extend(this._mediaLabels,true,Keys.MEDIA_POSITION,position),
                eventLabels
        );
    };
    RumDelegate.prototype.avFastForwardEvent = function(position,rate,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_FF_EVENT,
                Utils.extend(this._mediaLabels,true,Keys.MEDIA_POSITION,position),
                eventLabels
        );
    };
    RumDelegate.prototype.avSeekEvent = function(position,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_SEEK_EVENT,
                Utils.extend(this._mediaLabels,true,Keys.MEDIA_POSITION,position),
                eventLabels
        );
    };
    RumDelegate.prototype.avUserActionEvent = function(actionType,actionName,position,eventLabels){
        this.ac._addEventAndSend(
                Keys.AV_UA_EVENT,
                Utils.extend(this._mediaLabels,true,
                    Keys.MEDIA_POSITION,position,
                    Keys.USER_ACTION_TYPE, actionType,
                    Keys.USER_ACTION_NAME, actionName),
                eventLabels
        );
    };


    return RumDelegate;
});



define(
/**
 * Exports the EchoClient class, used for sending usage events
 * @exports Echo/EchoClient
 */
'echo/client',['require','./util/debug','./util/methods','./config/keys','./enumerations','./config/generator','./util/helper','./util/methods','./delegate/comscore/comscore-delegate','./delegate/rum/rum-delegate','./environment'],function(require){
    

    var DEBUG = require('./util/debug');
    var Util = require('./util/methods');

    var ConfigKeys = require('./config/keys'),
        Enums = require('./enumerations');



    /**
     * Initialise an EchoClient object
     * @constructor
     * @param {string} appName The name of your application
     * @param {string} appType The type of your application (one of Enums.AplicationType)
     * @param {object} [config] config key-value pairs to override default config
     * @param {Environment} [environment] Environment instance
     *
     * @example
     * var echo = new EchoClient('MyApp',ApplicationType.WEB,"abcdeffedcba");
     */
    function EchoClient(appName,appType,config,env){
        Util.assertContainsValue(Enums.ApplicationType,appType,
                'appType should be one of Enums.ApplicationType, got "' +
                    appType + '"');

        // Create space to hold state for the Application
        this.state = {
            counterNameSet  : false
        };
        var c = EchoClient.ConfigGenerator.generate(config);
        if( !c || !c[ConfigKeys.ECHO.ENABLED] ){ // disable if config invalid or enabled is false
            this._disable();
        }
        this._env = env || (new EchoClient.Environment());

        // Create set of 'consumers'
        this._setConsumers(EchoClient.Helper.cleanManagedLabelValue(appName),
                           appType,
                           c,
                           this._env);
        if(c && c[ConfigKeys.ECHO.DEVICE_ID]){
            this.setDeviceID(c[ConfigKeys.ECHO.DEVICE_ID]);
        }
    }

    // Dependencies, saved here so we can mock them
    EchoClient.ConfigGenerator = require('./config/generator');
    EchoClient.Helper = require('./util/helper');
    EchoClient.Util = require('./util/methods');
    EchoClient.ComScoreDelegate = require('./delegate/comscore/comscore-delegate');
    EchoClient.RumDelegate = require('./delegate/rum/rum-delegate');
    EchoClient.Environment = require('./environment');



/* *
 * --------------------------------------------------------------------
 * Private Metods
 * --------------------------------------------------------------------
 * */

    EchoClient.prototype._setConsumers = function(appName,appType,conf,env){
        if(this._isDisabled()){ //If disabled, dont do anything
            this.consumers = {}; return;
        } else {
            this.consumers = {};

            if(conf[ConfigKeys.COMSCORE.ENABLED]){
                this.consumers[EchoClient.Consumers.COMSCORE] =
                    new EchoClient.ComScoreDelegate( appName,appType,conf,env);
            }
            if(conf[ConfigKeys.RUM.ENABLED]){
                this.consumers[EchoClient.Consumers.RUM] =
                    new EchoClient.RumDelegate(appName,appType,conf,env);
            }
        }
        return this;
    };

    /**
     * Call the specified function on all objects in this.consumers
     * @private
     * @param {string} f_name Name of the function
     * @param {array} args Arguments
     * @param {integer} routing This should be a logical OR of values from {@link EchoClient#Consumers}
     */
    EchoClient.prototype._delegate = function(f_name,args,routing){
        if(typeof routing === 'undefined'){routing = 0xFFFFFFFF;}

        for (var index in this.consumers){
            if (index & routing){
                this.consumers[index][f_name].apply(this.consumers[index],args);
            }
        }
        return this;
    };


    /**
     * Turn off all eventing. Once EchoClient has been disbaled,
     * it cannot then be re-enabled (you need a new instance)
     * @private
     */
    EchoClient.prototype._disable = function(){
        DEBUG.log("EchoClient disabled");
        this._disabled = true;
        this._setConsumers(); //Wipes the consumers
        return this;
    };
    EchoClient.prototype._isDisabled = function(){ return this._disabled; };


/* *
 * --------------------------------------------------------------------
 * Application state Methods
 * --------------------------------------------------------------------
 * */


    /**
     * Add labels to be sent with every event. Multiple calls to
     * this function will append labels to the current list.
     * Label keys must only contain the following chars : [a-z0-9_-.]
     * Label values must be a string or number
     * @param {object} labels Key-value pairs
     * @returns {this} `this`
     * @example
     * // set a label
     * echo.addLabels({bun:'cinnamon'});
     * // Update it and set another
     * echo.addLabels({bun:'sticky',princess:'hotdog'});
     */
    EchoClient.prototype.addLabels = function(labels){
        this._delegate('addLabels',[EchoClient.Helper.cleanLabels(labels)]);
        return this;
    };
    /**
     * Add a single label
     * @param {string} key
     * @param {string|int} value
     * @returns {this} `this`
     */
    EchoClient.prototype.addLabel = function(key,value){
        var l = {};
        l[key] = value;
        return this.addLabels(l);
    };
    /**
     * Remove the specified labels
     * @param {array} labels A list of all the label names (keys) that need removing
     * @returns {this} `this`
     */
    EchoClient.prototype.removeLabels = function(labels){
        var cleanLabels = [];
        for(var i=0,j=labels.length;i<j;i++){
            cleanLabels.push(EchoClient.Helper.cleanLabelKey(labels[i]));
        }
        this._delegate('removeLabels',[cleanLabels]);
        return this;
    };

    /**
     * Indicate that the end users has opted out of (performance) cookies
     * @returns {this} `this`
     */
    EchoClient.prototype.optOutOfCookies = function(){
        this._delegate('optOutOfCookies',[]);
        return this;
    };
    /**
     * Set the version of the application (this is optional)
     * @param {string} version The version string for the application
     * @returns {this} `this`
     */
    EchoClient.prototype.setAppVersion = function(version){
        this._delegate('setAppVersion',[version]);
        return this;
    };

    /**
     * Set the countername for this page, this can also be set when
     * a viewEvent is sent. This method provides a way of setting the
     * countername without sending a view event. This should only be
     * done when inheriting from a parent Echo instance which has
     * already sent a view event
     *
     * @param {string} countername The countername
     *
     * @returns {this} `this`
     */
    EchoClient.prototype.setCounterName = function(countername){
        countername = EchoClient.Helper.cleanCounterName(countername);
        this._delegate('setCounterName',[countername]);
        this.state.counterNameSet = true;
        return this;
    };


    /**
     * Set the language of the content being displayed, as opposed to
     * the locale language (which can be set on the Enviromnment object)
     * the format for the tag still needs guidance from M&A, though I suspect
     * that following [these instructions](http://www.w3.org/International/questions/qa-choosing-language-tags)
     * will work out fine
     * @param {string} language The language (code) of the content
     * @returns {this} `this`
     */
    EchoClient.prototype.setContentLanguage = function(language){
        this._delegate('setContentLanguage',[language]);
        return this;
    };

    /**
     * Set the device ID. By default this is the s1 cookie, which
     * gets set after the first call to sa.bbc.co.uk is made. This
     * method overrides this by setting the istats_visitor_id label,
     * which will then get used as the device ID in DAx.
     *
     * device ID can also be passed in as a config value.
     * @param {string} id The device ID
     * @returns {this} `this`
     */
    EchoClient.prototype.setDeviceID = function(id){
        this._deviceID = id;
        this._delegate('setDeviceID',[id]);
        return this;
    };

    /**
     * Get the device ID. By defualt, this will return the s1 cookie.
     * If `echo.setDeviceID(val)` has been called, `val` will be returned
     * instead.
     */
    EchoClient.prototype.getDeviceID = function(){
        if(this._deviceID){
            return this._deviceID;
        } else {
            if(!this.state.comscoreEventSent){
                DEBUG.warn("Call to getDeviceID before any events were sent, this could " +
                        "mean that the s1 cookie is not yet set on the client.");
            }
            var getCookie = this._env.getCookieGetter() ||
                EchoClient.Environment._defaultGetCookie;
            return getCookie("s1");
        }
    };

/* *
 * ------------------------------------------------------------------------
 * Basic Analytics Methods
 * ------------------------------------------------------------------------
 * */

    /**
     * Register a 'view event'. This indicates a new 'page' has been displayed.
     * See [here](https://confluence.dev.bbc.co.uk/display/echo/Echo+Client+for+Product+Managers#EchoClientforProductManagers-Counternames)
     * for guidance on setting the countername. The '.page' suffix will be added
     * automatically if not provided.
     *
     * @param {string} countername The countername for this page
     * @param {object} eventLabels
     * @returns {this} `this`
     * @example
     * echo.viewEvent('news.scotland.page',{label1Key:'label1Value'});
     */
    EchoClient.prototype.viewEvent = function(countername,eventLabels){
        countername = EchoClient.Helper.cleanCounterName(countername);
        this._delegate('viewEvent',[countername,EchoClient.Helper.cleanLabels(eventLabels)]);
        this.state.counterNameSet = true;
        // Note down that we have evented to comScore at least once
        if(this.consumers[EchoClient.Consumers.COMSCORE]){
            this.state.comscoreEventSent = true;
        }
        return this;
    };
    /**
     * Register a bespoke event.
     * See [here](https://confluence.dev.bbc.co.uk/display/echo/Echo+Client+for+Product+Managers#EchoClientforProductManagers-Useractiontypesandnames)
     * for advice on setting the actionType and actionName values
     *
     * @param {string} actionType The type of the event (e.g. 'click')
     * @param {string} actionName A description of the event (e.g. 'Button Z')
     * @param {object} [eventLabels] Additional labels
     * @param {integer} [routing] This arg can be used to indicate the intended recipient of
     *                            this userAction event.
     * @returns {this} `this`
     * @example
     * // Register a UserAction event (which will be sent to Analytics (ComScore) only)
     * echo.userActionEvent('click','massive button',{info:'somrthing'});
     * // Register a UserAction event and make sure it is sent to  BBC systems (RUM) also
     * echo.userActionEvent('click','massive button',{info:'somrthing'},
     *  EchoClient.Routing.ANALYTICS | EchoClient.Routing.BBC);
     */
    EchoClient.prototype.userActionEvent = function(actionType, actionName, eventLabels, routing){
        var name_given = false;
        if(eventLabels && eventLabels.name){
            name_given = true;
            eventLabels.name = EchoClient.Helper.cleanCounterName(eventLabels.name); //Option to pass in countername
        }
        if(!this.state.counterNameSet && !name_given){
            DEBUG.error('userActionEvent: Countername not set. Either pass in a "name" label or send a viewEvent/call setcounterName first');
            return this;
        }

        // By default only send this to analytics
        if( typeof routing === 'undefined' ){ routing = EchoClient.Routing.ANALYTICS; }
        this._delegate('userActionEvent',[actionType, actionName, EchoClient.Helper.cleanLabels(eventLabels)], routing);

        // Note down that we have evented to comScore at least once
        if(this.consumers[EchoClient.Consumers.COMSCORE]){
            this.state.comscoreEventSent = true;
        }
        return this;
    };

    /**
     * Register an error event
     *
     * @param {Error} [error] An Error object (or any object with at
     *                        least "name" and "message" properties)
     * @param {object} [eventLabels] Labels to send with this event
     * @returns {this} `this`
     */
    EchoClient.prototype.errorEvent = function(error,eventLabels){
        this._delegate('errorEvent',[error,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };

/* *
 * ------------------------------------------------------------------------
 * Media Player Attributes
 * ------------------------------------------------------------------------
 * */

    /**
     * Set the name of the AV Media Player being used
     * @param {string} name
     * @returns {this} `this`
     */
    EchoClient.prototype.setPlayerName = function(name){
        Util.assert(typeof name === 'string' && name.length > 0,
                'setPlayerName: name must be string with length, got "'+name+'"');
        this._delegate('setPlayerName',[name]);
        return this;
    };
    /**
     * Set the version of the AV Media Player
     * @param {string} version The version string
     * @returns {this} `this`
     */
    EchoClient.prototype.setPlayerVersion = function(version){
        Util.assert(typeof version === 'string' && version.length > 0,'setPlayerVersion: version must be string with length, got "'+version+'"');
        this._delegate('setPlayerVersion',[version]);
        return this;
    };
    /**
     * Specify if the player has popped out to a new window
     * *Note: Changing this value will not generate an event,
     * but will change the value sent with all subsequent AV events*
     * @param {boolean} isPopped
     * @returns {this} `this`
     */
    EchoClient.prototype.setPlayerIsPopped = function(isPopped){
        Util.assert(typeof isPopped === 'boolean','setPlayerIsPopped: isPopped must be boolean, got "'+isPopped+'"');
        this._delegate('setPlayerIsPopped',[isPopped]);
        return this;
    };
    /**
     * Set the Media Player window state
     * *Note: Changing this value will not generate an event,
     * but will change the value sent with all subsequent AV events*
     * @param {string} state Preferably one of Echo.WindowState, but can be any string
     * @returns {this} `this`
     * @example
     * echo.setPlayerWindowState(Echo.WindowState.FULL);
     */
    EchoClient.prototype.setPlayerWindowState = function(state){
        Util.assertContainsValue(Enums.WindowState,state,
                'The window state must be set as a member of Enums.WindowState, got "'+
                    state + '"');
        this._delegate('setPlayerWindowState',[state]);
        return this;
    };
    /**
     * Set the volume
     * *Note: Changing this value will not generate an event,
     * but will change the value sent with all subsequent AV events*
     * @param {integer} volume Should be an integer in the range 0-100
     * @returns {this} `this`
     */
    EchoClient.prototype.setPlayerVolume = function(volume){
        Util.assert( volume <= 100 && volume >= 0,"volume must be 0-100, got: " + volume);
        this._delegate('setPlayerVolume',[volume>100?100:volume<0?0:volume]);
        return this;
    };
    /**
     * Indicate whether subtitles are turned on/off
     * *Note: Changing this value will not generate an event,
     * but will change the value sent with all subsequent AV events*
     * @param {boolean} isSubtitled (true for subtitles on)
     * @returns {this} `this`
     */
    EchoClient.prototype.setPlayerIsSubtitled = function(isSubtitled){
        Util.assert(typeof isSubtitled === 'boolean', 'setPlayerIsSubtitled: isSubtitled must be a boolean, got "'+isSubtitled+'"');
        this._delegate('setPlayerIsSubtitled',[isSubtitled]);
        return this;
    };


/* *
 * ------------------------------------------------------------------------
 * Media Attributes
 * ------------------------------------------------------------------------
 * */

    /**
     * Set details of the media which the player is about to play.
     *
     * **WARNING: Any updates made to the Media object after it is passed in to
     * Echo will NOT have any effect.**
     *
     * This method should be the first method called when the user requests a
     * new piece of content and must be called before the avEvent methods are
     * called. AV event messages will include all of the attributes of the media
     * object passed via (the most recent call to) this method.
     *
     * This method should only be called when the player is in a stopped state,
     * i.e. before a play event or after an end event.
     *
     * @param [Media] media A Media object defining the content which is being consumed.
     * @returns {this} `this`
     */
    EchoClient.prototype.setMedia = function(media){
        var clonedMedia = media.getClone();
        if(!this.state.counterNameSet){
            DEBUG.error('setMedia: Must send view event first');
            this.media = null;
            return;
        }
        this._delegate('setMedia',[clonedMedia]);
        this.media = clonedMedia;
    };
    /**
     * Set the length of the media (in milliseconds).
     *
     * Media length can be specified on the Media object prior to passing it to
     * Echo if the length is known up front. This method is provided to allow
     * players which do not know the length of piece of content before it starts
     * playing to report the length once it becomes available.
     *
     * For on-demand content, this This method must be called within the first
     * 60 seconds of playback (if the length has not already been passed to Echo
     * via the Media object). Failure to do so will result in inaccurate
     * consumption statistics for the content. This method should be called at
     * most once for each new piece of media passed to Echo.
     *
     * This method is not expected to be called for live content as a length of
     * zero should have been specified on the Media object passed to Echo.
     *
     * @param {integer} length The length of the media in ms.
     * @returns {this} `this`
     */
    EchoClient.prototype.setMediaLength = function(length){
        if(!this.media){
            DEBUG.error('setMediaLength: Must call setMedia first');
            return this;
        } else if ( !this.media.isOnDemand ){
            DEBUG.error('setMediaLength: Length should be set to zero prior to passing the media object to Echo for live media');
            return this;
        } else if ( this.media.lengthSet ){
            DEBUG.error('setMediaLength: Length can only be set once for a single piece of media');
            return this;
        } else if ( length < 0 ){
            DEBUG.error('setMediaLength: Length must be gretaer than zero for on-demand media, got "'+length+'"');
            return this;
        }

        this._delegate('setMediaLength',[length]);
        return this;
    };
    /**
     * Set the bitrate of the media player in kilobits per second (kbps).
     *
     * Bitrate is optional and can be specified on the Media object prior to
     * passing it to Echo. This method is provided to allow players which
     * support variable bitrate during streaming to update Echo with the current
     * bitrate as it changes. This method can be called multiple times for a
     * single piece of media.
     *
     * @param {integer} bitrate Bitrate in kilobits/s
     * @returns {this} `this`
     */
    EchoClient.prototype.setMediaBitrate = function(bitrate){
        Util.assert(bitrate > 0,'setMediaBitrate: bitrate must be > 0, got "'+
                bitrate+'"');
        this._delegate('setMediaBitrate',[bitrate]);
        return this;
    };

/* *
 * ------------------------------------------------------------------------
 * Media Events
 * ------------------------------------------------------------------------
 * */

    /**
     * Both content Id and AV Type must have been set before trying to use the
     * AV event methods.
     *
     * This method throws an exception in debug mode if both of these attributes
     * have not been set. It returns false in non-debug mode if both of these
     * attributes have not been set.
     *
     * @private
     * @returns True if the appropriate state is set up to use the av event
     *         methods. Returns false if state is not set up in non-debug mode
     *         or throws an exception in debug mode.
     */
    EchoClient.prototype._avEventsEnabled = function() {
        Util.assert(this.media,'setMedia() must be called prior to this method');
        return this.media !== null && typeof this.media !== 'undefined';
    };


    /**
     * Register an AV Play event
     *
     * @param {integer} position Position through the media in ms
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avPlayEvent = function(position,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avPlayEvent',[position,EchoClient.Helper.cleanLabels(eventLabels)]);
        if(this.consumers[EchoClient.Consumers.COMSCORE]){
            this.state.comscoreEventSent = true;
        }
        return this;
    };
    /**
     * Register an AV Pause event
     *
     * @param {integer} position Position through the media in ms
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avPauseEvent = function(position,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avPauseEvent',[position ,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };
    /**
     * Register an AV Buffer event
     *
     * @param {integer} position Position through the media in ms
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avBufferEvent = function(position,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avBufferEvent',[position,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };
    /**
     * Register an AV End event
     *
     * @param {integer} position Position through the media in ms
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avEndEvent = function(position,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avEndEvent',[position,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };
    /**
     * Register an AV Rewind event
     *
     * @param {integer} position Position through the media in ms
     * @param {integer} rate The rate of the rewind (i.e. 2 = double-speed)
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avRewindEvent = function(position,rate,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avRewindEvent',[position,rate,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };
    /**
     * Register an AV Fast Forward event
     *
     * @param {integer} position Position through the media in ms
     * @param {integer} rate The rate of the fast-forward (i.e. 2 = double-speed)
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avFastForwardEvent = function(position,rate,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avFastForwardEvent',[position,rate,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };
    /**
     * Register an AV Seek event
     *
     * @param {integer} position Position through the media in ms
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     */
    EchoClient.prototype.avSeekEvent = function(position,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avSeekEvent',[position,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };
    /**
     * Register a custom AV event
     *
     * @param {string} actionType The type of action
     * @param {string} actionName The name of the action
     * @param {integer} position Position through the media in ms (0 for simulcast)
     * @param {object} [eventLabels] Custom labels to set for this event
     * @returns {this} `this`
     * @example
     * echo.avUserActionEvent('click','av_related_button',5000);
     */
    EchoClient.prototype.avUserActionEvent = function(actionType,actionName,position,eventLabels){
        if(!this._avEventsEnabled()) return;
        this._delegate('avUserActionEvent',[actionType,actionName,position,EchoClient.Helper.cleanLabels(eventLabels)]);
        return this;
    };


    EchoClient.Consumers = { //NOTE: must be powers of 2
        COMSCORE    : 1<<0,
        RUM         : 1<<1
    };
    /**
     * Options for routing userAction events
     * @property ANALYTICS Analytics endpoints
     * @property BBC The BBC data pipeline
     */
    EchoClient.Routing = {
        ANALYTICS   : EchoClient.Consumers.COMSCORE,
        BBC         : EchoClient.Consumers.RUM
    };

    return EchoClient;
});


define(
/**
 * Exports the Media class, used for setting meta-data associated with
 * a piece of AV content
 * @exports Echo/Media
 * @author James Skinner <james.skinner1@bbc.co.uk>
 */

'echo/media',['require','./enumerations','./util/methods'],function(require){
    

    var Enums = require('./enumerations'),
        Util = require('./util/methods');

    var AvType = Enums.AvType,
        RetrievalType = Enums.RetrievalType,
        Form = Enums.Form,
        PIPsType = Enums.PIPsType,
        MediaConsumptionMode = Enums.MediaConsumptionMode;

    // Default 60 seconds (in millis) media length for on-demand.
    var DEFAULT_MEDIA_LENGTH = 60000;



    /**
     * Initialise a Media object.
     * @constructor
     * @param {string} contentId
     *            The PIPs identifier for the media content; An episode or clip ID
     * @param {AvType} avType
     *            The AV type of the media, one of `Echo.Enums.AvType`.
     * @param {PIPSType} pipsType Episode or clip (One of `Echo.Enums.PIPsType`)
     * @param {String} versionId The version PID
     * @param {String} serviceId The service ID should be passed in when mediaConsumptionMode is LIVE.
     *                           Otherwise this should be passed in as null.
     * @param {MediaConsumptionMode} mediaConsumptionMode Whether the media is on-demand or live.
     *
     * When determining how to set this flag, consider the experience
     * from the user's perspective. Did they need to plan their time
     * around the BBC in order to view this content? i.e. They had to
     * be in front of a screen / radio at 3pm on a given day in order
     * to watch it. If so, the content is live (regardless of whether
     * the 'screen' is big-screen, console, browser etc). If they
     * didn't need to be there at a particular time, rather they sat
     * down when they wanted and asked the BBC to serve the content
     * at that point (again, regardless of screen type) it is
     * on-demand.
     *
     * @param {RetrievalType} retrievalType Whether the media is being streamed or has been downloaded.
     *
     *
     * @example
     * var media = new Media('p01kqt9x',
     *                       Echo.Enums.AvType.VIDEO,
     *                       Echo.Enums.PIPSType.EPISODE,
     *                       'b03jglbh',
     *                       null,
     *                       Echio.Enums.MediaConsumptionMode.ON_DEMAND,
     *                       Echo.Enums.RetrievalType.STREAM)
     *
     */
    function Media(contentId, avType, pipsType, versionId,
                    serviceId, mediaConsumptionMode, retrievalType) {
        this.contentId = contentId;
        this.avType = avType;
        this.pipsType = pipsType || Enums.PIPsType.EPISODE;
        this.versionId = versionId;
        this.serviceId = serviceId;
        this.mediaConsumptionMode = mediaConsumptionMode || MediaConsumptionMode.ON_DEMAND;
        this.retrievalType = retrievalType;

        // Check that these parameters are all good
        Media._validate(this);

        // See Jira: NKDATA-181
        this.length = this.isOnDemand() ? DEFAULT_MEDIA_LENGTH : 0;

        this.bitrate = null;
        this.form = Form.LONG; //Default to an episode
        this.codec = null;
        this.cdn = null;

        //Has the client set the length on this object (as opposed to a default)
        this.lengthSet = false;
    }

    /**
     * Checks that the various parameters passed into the constructor are
     * valid wrt eachother. If not it fixes things if point
     * @private
     *
     */
    Media._validate = function(m){
        // WARNING - side effects
        Util.assert(typeof m.contentId === 'string' && m.contentId.length > 0,
                'contentId must be a string with length, got "' + m.contentId + '"');

        Util.assertContainsValue(AvType,m.avType,
                'avType must be on of AvType, got + "'+m.avType+'"');

        if(!Util.assertContainsValue(PIPsType,m.pipsType,
                'pipsType must be on of Enums.PIPsType, got "'+m.pipsType+'"')){
            // Set ON_DEMAND as default (NKDATA-467)
            m.pipsType = PIPsType.EPISODE;
        }

        Util.assert(typeof m.versionId === 'string' && m.versionId.length > 0,
                'versionId should be a non-empty string');

        Util.assertContainsValue(RetrievalType,m.retrievalType,
                'retrievalType must be one of Medias.RetrievalType, got "'+
                    m.retrievalType+'"');

        if(!Util.assertContainsValue(MediaConsumptionMode,m.mediaConsumptionMode,
                'mediaConsumptionMode should be one of Enums.MediaConsumptionMode')){
            // Set default to ON_DEMAND NKDATA-467
            m.mediaConsumptionMode = MediaConsumptionMode.ON_DEMAND;
        }

        if (m.mediaConsumptionMode === MediaConsumptionMode.LIVE){
            Util.assert(typeof m.serviceId  === 'string' && m.serviceId.length > 0,
                    'serviceId should be non-empty string when Live');

            Util.assert(m.retrievalType === RetrievalType.STREAM,
                    'If the content is live, retreival type must be STREAM, got "' +
                    m.retrievalType + '"');
        } else {
            Util.assert(m.serviceId === null || typeof m.serviceId === 'string',
                    'serviceId should be null when onDemand');
        }

    };

    /**
     * Set the length of the media. This attribute can also be set on
     * the EchoClient instance after calling `setMedia()` with the `setMediaLength()` method
     * @param {integer} length The length of th media content (in ms)
     * @returns {this} `this`
     */
    Media.prototype.setLength = function(length) {
        Util.assert(length >= 0,"Length must be >= 0, got " + length);
        Util.assert((this.isOnDemand && length > 0) ||
                     (!this.isOnDemand && length === 0),
                     'Length must be > 0 for onDemand and 0 for live, got length ' +
                        length + ' and onDemand = ' + this.isOnDemand );
        this.lengthSet = true;
        this.length = length;
        return this;
    };
    /**
     * This is a legacy BBC concept which represents whether the
     * content has been / will be aired on 'terrestrial' or not. If
     * it has/will, the content is considered on-schedule. If not, it
     * is considered off-schedule i.e. webcast only.
     *
     * @param {EchoSchduleMode} mode The schdule mode (ON or OFF)]#
     * @returns {this} `this`
     */
    Media.prototype.setScheduleMode = function(mode){
        if(Util.assertContainsValue(Enums.EchoScheduleMode,mode,
                'scheduleMode should be one of Enums.EchoScheduelMode')){
            this._scheduleMode = mode;
        }
        return this;
    };
    /**
     * @returns {EchoScheduleMode} mode
     */
    Media.prototype.getScheduleMode = function(){
        return this._scheduleMode || null;
    };
    /**
     * Set the bitrate of the media (kilobits per second). This attribute can be
     * updated during playback by calling `setMediaBitrate()` on the EchoClient instance
     * @param {integer} bitrate the bit rate of the media content (kilobits/s)
     * @returns {this} `this`
     */
    Media.prototype.setBitrate = function(bitrate) {
        this.bitrate = bitrate;
        return this;
    };
    /**
     * Set the "form" of the media, this is one of
     * `Form` and distingushes a peice of long content
     * from a short one (e.g. an episode vs a clip)
     * @param {Form} form The form
     * @returns {this} `this`
     * @example media.setForm(Echo.Enums.Form.LONG);
     */
    Media.prototype.setForm = function(form) {
        this.form = form;
        return this;
    };

    /**
     * Set the codec of the media
     * @param {string} codec The codec in use
     * @returns {this} `this`
     */
    Media.prototype.setCodec = function(codec) {
        this.codec = codec;
        return this;
    };

    /**
     * Set the CDN of the media
     * @param {string} cdn The CDN being used
     * @returns {this} `this`
     */
    Media.prototype.setCDN = function(cdn) {
        this.cdn = cdn;
        return this;
    };

    Media.prototype.getClone = function(){
        var m = new Media(this.contentId, this.avType, this.pipsType, this.versionId,
                    this.serviceId, this.mediaConsumptionMode, this.retrievalType, this.isOnSchedule);
        m.length = this.length;
        m.bitrate = this.bitrate;
        m.form = this.form;
        m.codec = this.codec;
        m.cdn = this.cdn;
        m.lengthSet = this.lengthSet;

        return m;
    };

    Media.prototype.getContentId = function() {
        return this.contentId;
    };

    Media.prototype.getAvType = function() {
        return this.avType;
    };

    Media.prototype.getPIPsType = function() {
        return this.pipsType;
    };

    Media.prototype.getVersionId = function() {
        return this.versionId;
    };
    Media.prototype.getServiceId = function() {
        return this.serviceId;
    };
    Media.prototype.getMediaConsumptionMode = function() {
        return this.mediaConsumptionMode;
    };
    Media.prototype.getRetrievalType = function() {
        return this.retrievalType;
    };

    Media.prototype.getLength = function() {
        return this.length;
    };

    Media.prototype.getBitrate = function() {
        return this.bitrate;
    };

    Media.prototype.getForm = function() {
        return this.form;
    };

    Media.prototype.getCodec = function() {
        return this.codec;
    };

    Media.prototype.getCDN = function() {
        return this.cdn;
    };

    Media.prototype.isVideo = function() {
        return this.avType === AvType.VIDEO;
    };
    Media.prototype.isEpisode = function(){
        return this.pipsType === PIPsType.EPISODE;
    };
    Media.prototype.isOnDemand = function(){
        return this.mediaConsumptionMode === MediaConsumptionMode.ON_DEMAND;
    };

    return Media;
});




define( 'echo',['require','echo/meta','./echo/client','./echo/media','./echo/environment','./echo/enumerations','./echo/config/keys','./echo/util/debug'],function(require){
    

/**
 * Exports the EchoClient class, used for sending usage events
 * @exports Echo
 * @author James Skinner <james.skinner1@bbc.co.uk>
 * @example

    require(['echo'],function(Echo){

        var Media = Echo.Media,             // Media class
            EchoClient = Echo.EchoClient,   // Echo Client class
            Enums = Echo.Enums,             // Enums
            ConfigKeys = Echo.ConfigKeys,   // Key names to use in config
            Environment = Echo.Environment;

    // ** Enable Debug mode (for testing)
        Echo.Debug.enable();

    });

 */
    var meta = require('echo/meta');

    var exports = {
        /** EchoClient class */
        EchoClient  : require('./echo/client'),
        /** Media class */
        Media       : require('./echo/media'),
        /** Environment class */
        Environment : require('./echo/environment'),
        /** Enumerations */
        Enums : require('./echo/enumerations'),
        /** Keys to use in config for EchoClient */
        ConfigKeys : require('./echo/config/keys'),
        /** Used to turn debugging on */
        Debug : require('./echo/util/debug'),

        getAPIVersion : function(){ return meta.API_VERSION; },
        getImplementationVersion : function(){ return meta.VERSION; }
    };

    return exports;
});

