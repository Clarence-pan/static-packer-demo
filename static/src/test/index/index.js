import $ from 'jquery';
import Q from 'common';

var pages = 'component-with-image, async';

pages.split(/,\s*/).forEach(function (page) {
    if (page){
        $('<li><a></a></li>').appendTo('#menu')
            .find('a')
            .attr('href', '/test/' + page)
            .text(page.replace(/[_-]/g, ' '));
    }
});

