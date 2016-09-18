import $ from 'jquery';
import _ from 'underscore';
import common from 'common';
import prompt from './prompt';

$("<div class='message'>Hello from js: this is home page!</div>").appendTo('body');

prompt.show();

