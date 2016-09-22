import $ from 'jquery';
import _ from 'underscore';
import common from 'common';
import React from 'react';
import ReactDOM from 'react-dom';

import detail from '../detail/index.tsx';

console.log('Detail: %o', detail);

$("<div class='message'>Hello from jsx: this is book/detail page!</div>").appendTo('body');

common.log("Hello via common.log!");

class App extends React.Component{
    render(){
        return <div>This is from React via jsx!</div>;
    }
}

ReactDOM.render(<App />, $('<div id="react-container"></div>').appendTo('body')[0]);
