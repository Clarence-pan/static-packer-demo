import Promise from 'promise';
import requireJsConfig from './requirejs-config';

export default {
    amdRequire: function (modules, doneCallback, errCallback) {
        var promise = initAmd()
            .then(function(){
                console.log('require js ready to work!');
                if (typeof window.require === 'undefined') {
                    var err = "window.require not exists! Have you imported requirejs.js in your page?";
                    console.log("Error: " + err);
                    throw new Error(err);
                }

                return new Promise(function(resolve, reject){
                    window.require(modules, function(){
                        resolve.call(this, [].slice.call(arguments, 0));
                    }, function(err){
                        reject(err);
                    });
                });
            }, function(err){
                if (typeof errCallback === 'function'){
                    errCallback(err);
                }

                console.log("Error: failed to init AMD require: %o", err);
                throw err;
            });

        if (doneCallback){
            promise = promise.then(function(modules){
                doneCallback.apply(this, modules);
            });
        }

        if (errCallback) {
            promise = promise.then(null, errCallback);
        }

        return promise;
    },
    amdDefine: function (...args) {
        if (typeof window.define !== 'undefined') {
            return window.define(...args);
        } else {
            this.log("Warning: window.require or window.require.define not exists! Have you imported requirejs.js in your page?");
        }
    },
    amdExport: function (moduleName, moduleDefine) {
        return this.amdDefine(moduleName, function () {
            console.log('amd-export %o as ' + moduleName, moduleDefine);
            return moduleDefine;
        });
    },
    waitFor: waitFor,
    initAmd: initAmd,
}

function initAmd(timeout) {
    if (initAmd.done) {
        return Promise.resolve();
    }

    return Promise.all([
        loadRequireJsConfig().then(function(data){
            console.log("loadRequireJsConfig: done: %o", data);
            return data;
        }),
        waitForRequireJsReady().then(function(data){
            console.log("waitForRequireJsReady: done: %o", data);
            return data;
        })
    ]).then(function (args) {
        console.log('initAmd: done: %o', args);
        window.require.config(args[0]);
        initAmd.done = true;
    });
}

function waitForRequireJsReady(timeout)
{
    console.log('requirejs: %o', window.require);
    return waitFor(() => (typeof window.require !== 'undefined'), timeout);
}

function waitFor(callback, timeout, interval) {
    timeout = +timeout || 5000; // ms
    interval = +interval || 100; // ms

    var got = callback();
    if (got) {
        return Promise.resolve(got);
    }

    return new Promise(function (resolve, reject) {
        var start = +new Date();
        var timer = setInterval(function () {
            var now = +new Date();

            got = callback();
            if (got) {
                clearInterval(timer);
                resolve(got);
                return;
            }

            if (now - start > timeout) {
                var err = new Error("Timeout after " + (now - start) + 'ms.');
                err.type = 'timeout';
                clearInterval(timer);
                reject(err);
            }
        }, interval);
    });
}


function loadRequireJsConfig() {
    if (loadRequireJsConfig.data) {
        return Promise.resolve(loadRequireJsConfig.data);
    } else {
        return requireJsConfig
            .load()
            .then(function (data) {
                loadRequireJsConfig.data = data;
                console.log('load requirejs config: %o', data);
                return data;
            });
    }
}

