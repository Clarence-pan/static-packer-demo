import * as $ from 'jquery';
import * as _ from 'underscore';
import * as common from 'common';
import * as React from "react";
import * as ReactDOM from "react-dom";


$("<div class='message'>Hello from ts: this is book/detail page!</div>").appendTo('body');

common.log("Hello via common.log!");

class App extends React.Component<any, any>{
    render(){
        return (
            <div>This is from React via tsx!</div>
        );
    }
}

ReactDOM.render(<App />, $('<div id="react-container"></div>').appendTo('body')[0]);
