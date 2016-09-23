import 'babel-polyfill';
import $ from 'jquery';
import Q from 'common';


async function asyncLoadData() {
    try {
        var response = await fetch('/');
        var responseData = await response.text();
        console.log('Got Data: %o', responseData);
        return responseData;
    } catch (e) {
        Q.reportError(e);
    }
}


$('<div><a href="javascript:;">Load Data</a></div>').appendTo('body')
    .on('click', 'a', function(){
        asyncLoadData().then(function(data){
            $('<div><h3>Got Data:</h3><div class="output"></div></div>').appendTo('body')
                .find('.output').text(data);
        });
    });
