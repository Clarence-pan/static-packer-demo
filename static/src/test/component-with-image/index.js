import $ from 'jquery';
import Q from 'common';
import Loading from 'app/components/loading';

$(function(){
    initPage();
});

function initPage()
{
    var loading = $('<div></div>');

    React.render(React.createElement(Loading), loading[0]);

    $('<div><a href="javascript:;">Click To Show Image</a></div>')
        .appendTo('body')
        .on('click', 'a', function(){
            loading.appendTo('body');
            Q.amdRequire(['components/component-with-image'], function(ImageComponent){
                loading.remove();
                Q.renderReactComponent(ImageComponent)
                 .to($('<div></div>').appendTo('body'));
            }, function(err){
                loading.remove();
                Q.reportError(err);
            });
        });

}

