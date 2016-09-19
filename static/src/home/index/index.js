import $ from 'jquery';
import _ from 'underscore';
import common from 'common';
import prompt from './prompt';

$("<div class='message'>Hello from js: this is home page!</div>").appendTo('body');

console.log('prompt: ', prompt);
console.log("This message is 66666666666!");

$("<div><a href='javascript:;'>Show Prompt</a></div>").appendTo('body').on('click', function(){
    prompt.show();
});

$("<div><a href='javascript:;'>Click here!</a></div>").appendTo('body').on('click', function(){
    console.log('You clicked [click here!]');
    common.amdRequire(['components/dialog'], function(dialog){
        console.log('loaded dialog: %o', dialog);
        dialog.show("This dialog is loaded via AMD style require!");
    });
});

