import $ from 'jquery';
import Q from 'common';

var pages = 'component-with-image';

pages.split(/,|(,?\s+)/).forEach(function (page) {
    $('<li><a></a></li>').appendTo('#menu')
        .find('a')
        .attr('href', '/test/' + page)
        .text(page.replace(/[_-]/g, ' '));
});

