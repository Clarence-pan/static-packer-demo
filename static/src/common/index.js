import amdRequire from './amd-require';

var log = (function () {
    if (typeof console !== 'undefined' && console && console.log) {
        return console.log.bind(console);
    } else {
        return function () {
        };
    }
})();

var Common = {
    extend: extend,
    log: log,
    resolveSelfScriptSrcUrl: resolveSelfScriptSrcUrl,
    resolveSelfScriptShortName: resolveSelfScriptShortName,
};

// 合并Common模块
Common = Common.extend(Common, amdRequire);

// 导出Common变量，以便共用
if (typeof window !== 'undefined') {
    window.Common = Common;
}

console.log("Self script src URL: %o", resolveSelfScriptSrcUrl());
console.log("Self script short name: %o", resolveSelfScriptShortName());
console.log("Self script params: %o", resolveSelfScriptSrcUrlParams());

var params = resolveSelfScriptSrcUrlParams();
if (params && (params.amd === 'on' || params.amd === 'true' || params.amd === 'yes')){
    Common.initAmd();
}

////////////////////////////////////////////////////////////////////////
// 函数定义：
////////////////////////////////////////////////////////////////////////

function extend(receiver) {
    receiver = receiver || {};

    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        if (!arg) {
            continue;
        }

        for (var k in arg) {
            if (arg.hasOwnProperty(k)) {
                receiver[k] = arg[k];
            }
        }
    }

    return receiver;
}

/**
 * 解析当前脚本的源路径
 * @returns string
 */
function resolveSelfScriptSrcUrl() {
    console.log("document.ready: " + document.readyState);

    var selfScript = null;
    var scripts = document.getElementsByTagName('script');
     if (document.currentScript){
        selfScript = document.currentScript;
    } else if (document.readyState === 'loading'){
        selfScript = scripts[scripts.length - 1];
    } else {
        eachReverse(scripts, function (script) {
            if (script.readyState === 'interactive') {
                selfScript = script;
                return false;
            }
        });
    }

    if (!selfScript){
        throw new Error("Cannot resolve self script!");
    }

    return (selfScript.src || '') + '';
}

/**
 * 解析当前脚本源路径中的参数
 * @returns {{}}
 */
function resolveSelfScriptSrcUrlParams(){
    return parseQueryParamsOfUrl(resolveSelfScriptSrcUrl());
}

/**
 * 解析URL中的参数
 * @param url
 * @returns {{}}
 */
function parseQueryParamsOfUrl(url) {
    if (!url) {
        return {};
    }

    var queryPos = url.indexOf('?');
    if (queryPos < 0) {
        return {};
    }

    return parseQueryString(url.substring(queryPos + 1));
}

/**
 * 解析QueryString中的参数
 * @param query
 * @returns {{}}
 */
function parseQueryString(query) {
    if (!query) {
        return {};
    }

    var params = {};
    var parts = query.split('&');
    for (var i = 0, len = parts.length; i < len; i++) {
        var part = parts[i];
        var assignPos = part.indexOf('=');
        var key = decodeURIComponent(part.substring(0, assignPos));
        params[key] = decodeURIComponent(part.substring(assignPos + 1));
    }

    return params;
}

/**
 * 解析URL中的路径
 * @param url
 * @returns {*}
 */
function parsePathOfUrl(url) {
    if (!url) {
        return '';
    }

    // 先干掉查询字符串
    var queryPos = url.indexOf('?');
    url = (queryPos > 0 ? url.substring(0, queryPos) : url);

    // 干掉协议
    var hasHost = false;
    var schemaPos = url.indexOf('://');
    if (schemaPos > 0) {
        url = url.substring(schemaPos + 3);
        hasHost = true;
    } else if (url.substring(0, 2) === '//') {
        url = url.substring(2);
        hasHost = true;
    }

    // 干掉主机和认证部分
    if (hasHost) {
        url = url.replace(/^[^\/]+/, '');
    }

    return url;
}

/**
 * 解析当前脚本的短名称 -- 干掉域名、路径前缀和后缀名
 * 如本文件会被解析为 "common"
 */
function resolveSelfScriptShortName() {
    var src = resolveSelfScriptSrcUrl();

    // 解析路径
    src = parsePathOfUrl(src);

    // 干掉前导的'/'
    src = src.replace(/^\/+/, '');

    // 干掉dist文件夹
    src = src.replace(/^(dist\/)/, '');

    // 干掉后面的hash和后缀名
    var shotName = src.replace(/_[0-9a-zA-Z]+\.js$/, '');

    log("resolved shortname: " + shotName);

    return shotName;
}

/**
 * Helper function for iterating over an array backwards. If the func
 * returns a `false`, it will break out of the loop.
 */
function eachReverse(ary, func) {
    if (ary) {
        var i;
        for (i = ary.length - 1; i > -1; i -= 1) {
            if (ary[i] && func(ary[i], i, ary) === false) {
                break;
            }
        }
    }
}

function dir(obj, onlyOwned) {
    if (obj === null) {
        return '<null>';
    } else if (typeof obj === 'undefined') {
        return '<undefined>';
    }

    var keys = {};
    for (var k in obj) {
        if (!obj.hasOwnProperty(k) && onlyOwned) {
            continue;
        }

        var v = obj[k];
        if (typeof v === 'function') {
            keys[k] = '<function>';
        } else if (typeof v === 'object') {
            keys[k] = '<object>';
        } else {
            keys[k] = v;
        }
    }

    return keys;
}
