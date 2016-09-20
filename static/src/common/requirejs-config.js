var baseUrl = (window.STATIC_SERVER || 'js') + '/dist';
var config = {
    baseUrl: baseUrl,
    paths: {
        'jquery': '../lib/jquery',
        'underscore': '../lib/underscore',
        'react': __DEBUG_REACT__ ? '../lib/react' : '../lib/react.min',
        'react-dom': __DEBUG_REACT__ ? '../lib/react' : '../lib/react.min',
    },
    shim: {
        //'react': {
        //    'exports': 'React'
        //},
        //'react-dom': {
        //    'exports': 'ReactDOM'
        //}
    }
};


export default {
    config: config,
    load: loadRequireJsConfig
};

function loadRequireJsConfig() {
    var callbackName = 'manifestJsonpCallback';

    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: baseUrl + '/manifest.js',
            dataType: 'jsonp',
            jsonp: false,
            jsonpCallback: callbackName
        })
            .then(function (response) {
                console.log('loaded requirejs config: %o', response);
                var data = response;
                if (typeof(response) !== 'object'){
                    try {
                        data = JSON.parse(response);
                        if (!data){
                            reject(new Error("Empty response!"));
                            return;
                        }
                    } catch (e){
                        reject(e);
                        return;
                    }
                }

                var jsExtRegex = /\.js$/;

                for (var file in data){
                    if (data.hasOwnProperty(file) && jsExtRegex.test(file)){
                        config.paths[file.replace(jsExtRegex, '')] = data[file].replace(jsExtRegex, '');
                    }
                }

                resolve(config);
            }, function (err) {
                reject(err);
            });
    });
}

