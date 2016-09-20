import $ from 'jquery';
import amdRequire from './amd-require';

var log = (function (...args) {
    if (typeof console !== 'undefined' && typeof console.log === 'function') {
        // 很奇怪，IE8上虽然支持console.log但是不支持bind
        if (typeof console.log.bind === 'function') {
            return console.log.bind(console);
        } else {
            return console.log(...args);
        }
    } else {
        return function () {
        };
    }
})();

var Common = {
    log: log,
    dir: dir,
    extend: extend,
    urlify: urlify,
    parseQueryParamsOfUrl: parseQueryParamsOfUrl,
    parseQueryString: parseQueryString,
    parsePathOfUrl: parsePathOfUrl,
    initReact: initReact,
    renderReactComponent: renderReactComponent,
    eachReverse: eachReverse
};

// 合并Common模块
export default Common = Common.extend(Common, amdRequire);


// 导出Common变量到window中，以便共用
if (typeof window !== 'undefined') {
    window.Common = Common;
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


function urlify(str) {
    return (str + '').replace(/\\/g, '/');
}

/**
 * 初始化React
 * @param callback
 * @returns {Promise}
 */
function initReact(callback) {
    var promise;
    if (window.React) {
        promise = Promise.resolve(window.React);
    } else {
        promise = new Promise(function (resolve, reject) {
            Common.amdRequire(['react', 'react-dom'], function (React, ReactDOM) {
                console.log("[amdRequire] React: %o", React);
                console.log("[amdRequire] ReactDOM: %o", ReactDOM);

                React.render = ReactDOM.render.bind(ReactDOM);
                React.findDOMNode = ReactDOM.findDOMNode.bind(ReactDOM);

                // 导出到window上
                window.React = React;
                window.ReactDOM = ReactDOM;

                resolve(React);
            });
        });
    }


    if (typeof callback === 'function') {
        promise = promise.then(callback);
    }

    return promise;
}

/**
 * 一个渲染React组件的快捷方法 -- 支持jquery
 * 如：renderReactComponent(App, {props...}).to('#id')
 * @param componentClass
 * @param props
 * @param children
 * @returns {{to: function(target)}}
 */
function renderReactComponent(componentClass, props, children) {
    var createElemArgs = arguments;
    return {
        to: function (target) {
            var err;
            if (typeof target === 'string') {
                target = $(target);
            }

            if (target && target.jquery) {
                target = target[0];
            }

            if (!target) {
                err = new Error("Warning: Empty target to render!");
                err.type = "empty-target";
                console.log(err);
                return Promise.reject(err);
            }

            return initReact()
                .then(function (React) {
                    var component = React.createElement.apply(React, createElemArgs);
                    return React.render(component, target);
                });
        }
    };
}
