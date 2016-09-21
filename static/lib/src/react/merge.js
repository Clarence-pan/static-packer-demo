/**
 * React 2.x 之后的版本都是把React和ReactDOM分开了，这样很不方便 -- so，为了便于在前台使用我们还是把这两个东东合在一起吧：
 */
(function (require, define) {
    // begin wrapper of merge.

    $include('react');
    $include('react-dom');

    // end wrapper of merge
    (function (g) {
        if (typeof require === 'function') {
            require.call(null, ['react', 'react-dom'], mergeReactAndReactDom);
        } else {
            mergeReactAndReactDom(g.React, g.ReactDOM);
        }

        function mergeReactAndReactDom(React, ReactDOM) {
            if (React) {
                g.React = React;
            }

            if (ReactDOM) {
                g.ReactDOM = ReactDOM;
            }

            if (g.ReactDOM && g.React) {
                if (!g.React.render) {
                    g.React.render = g.ReactDOM.render.bind(g.ReactDOM);
                }

                if (!g.React.findDOMNode) {
                    g.React.findDOMNode = g.ReactDOM.findDOMNode.bind(g.ReactDOM);
                }
            }

            return {};
        }
    })(typeof window !== 'undefined' ? window :
        (typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? module.exports :
            (typeof global !== 'undefined' ? global : {})));
}).apply(null, (function () {
    // 一个炒鸡简单的同步版本的requirejs有木有，就是为reactjs而写的：
    var definedModules = {};

    var require = function (depends, callback) {
        var resolved = [];
        for (var i = 0; i < depends.length; i++){
            resolved = definedModules[depends[i]];
        }

        return callback.apply(null, resolved);
    };

    var define = function (module, depends, callback) {
        if (typeof module !== 'string'){
            callback = depends;
            depends = module;
            module = null;
        }

        var definedModule = require(depends, callback);
        if (module){
            definedModules[module] = definedModule;
        }

        return definedModule;
    };

    return [require, define];
})());
