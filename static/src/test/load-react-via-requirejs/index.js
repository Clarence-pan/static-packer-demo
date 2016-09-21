import $ from 'jquery';
import Q from 'common';
import React from 'react';
import ReactDOM from 'react-dom';

// 注意：React是通过外部库引入到window变量中，然后才可以通过import导入。
// 如果本js加载时React尚未加载，则下面这一行会报错，不信你试试。
// 想要通过import的方式导入React组件，则必须要先加载React.
// 如果想懒加载React和相关组件，则请参考下面的示例 -- 通过requirejs来加载React和对应的组件。
//import Loading from 'app/components/loading';

console.log('jQuery: ', $);

log("Page initializing...");
dumpVariables();

$("<div><a href='javascript:;'>Load React via Requirejs</a></div>").appendTo('body')
    .on('click', 'a', function(){
        log("You have clicked [" + $(this).text() + ']. Now the variables: ');

        dumpVariables();

        log("Begin load React...");
        var loading = Q.appendLoadingTo('body');

        // 为了方便快捷地使用React，这里提供了一个快捷函数：
        Q.initReact()
         .then(function(React){
             loading.remove();

             log('End load React.');
             dumpVariables();
             // Output:
             //    ...
             //    Type of imported React: undefined
             //    Type of global React: object
             //    Type of imported ReactDOM: undefined
             //    Type of global ReactDOM: object
             //    ...
             // 注： 即使通过requirejs方式加载了React，但是import方式加载进来的React还是为空 -- 此时已经无法修改了
             //      如果想直接使用React组件，则可以通过全局变量的方式时候用，或者像本例一样来使用Promise.then中的React参数

             log("Well. Let's draw something by React:");
             loading = Q.appendLoadingTo('body');

             return Q.amdRequire(['components/component-with-image'], function(ImageComponent){
                 loading.remove();
                 React.render(React.createElement(ImageComponent), $('<div></div>').appendTo('body')[0]);
                 log("The above image is draw by React.");
             });
         }).catch(Q.reportError);
    });


function log(message){
    $('<div></div>').text(message).appendTo('body');
}


function dumpVariables()
{

    log("Type of imported jQuery: " + typeof($));

    log("Type of global jQuery: " + typeof(window.jQuery));

    log("Type of imported common: " + typeof(Q));

    log("Type of global common: " + typeof(window.Common));

    log("Type of global React: " + typeof(window.React));

    log("Type of imported React: " + typeof(React));

    log("Type of global React: " + typeof(window.React));

    log("Type of imported ReactDOM: " + typeof(ReactDOM));

    log("Type of global ReactDOM: " + typeof(window.ReactDOM));
}