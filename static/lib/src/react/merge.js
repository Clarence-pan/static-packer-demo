/**
 * React 2.x 之后的版本都是把React和ReactDOM分开了，这样很不方便 -- so，为了便于在前台使用我们还是把这两个东东合在一起吧：
 */

(function (g) {
    if (typeof define === 'function') {
        define(['react', 'react-dom'], mergeReactAndReactDom);
    } else if (typeof g.require === 'function') {
        g.require(['react', 'react-dom'], mergeReactAndReactDom);
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
    }
})(typeof window !== 'undefined' ? window :
    (typeof module !== 'undefined' && typeof module.exports !== 'undefined' ? module.exports :
        (typeof global !== 'undefined' ? global : {})));
