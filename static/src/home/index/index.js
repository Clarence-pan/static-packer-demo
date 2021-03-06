import $ from 'jquery';
import _ from 'underscore';
import common from 'common';
import prompt from './prompt';

console.log('jQuery: ', $);
console.log('_: ', _);
console.log('common: ', common);
console.log('common.env: ' + JSON.stringify(common.env));
console.log('prompt: ', prompt);


$("<div class='message'>Hello from js: this is home page!</div>").appendTo('body');


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


$('<div><a href="javascript:;">Show message-with-less</a><div class="message"></div></div>')
    .appendTo('body')
    .on('click', 'a', function(){
        var $btn = $(this);
        console.log('You clicked: [' + $btn.text() + ']');
        common.initReact()
            .then(function(){
                return common.amdRequire(['components/message-with-less']);
            })
            .then(function(modules){
                var [Message] = modules;
                console.log("Message: %o", Message);
                common.renderReactComponent(Message).to($btn.siblings('.message'));
            });
    });

