export default {
    load: loadRequireJsConfig
};

function loadRequireJsConfig() {
    var serverBase = (window.Common.env.STATIC_SERVER || 'statics');
    var baseUrl = serverBase + '/dist';
    var config = {
        baseUrl: baseUrl,
        paths: {},
        shim: {
            'react': {
                'exports': 'React'
            },
            'react-dom': {
                'exports': 'ReactDOM'
            }
        }
    };

    var callbackName = 'manifestJsonpCallback';

    return new Promise(function (resolve, reject) {
        $.ajax({
                type: 'GET',
                url: serverBase + '/manifest.js',
                dataType: 'jsonp',
                jsonp: false,
                jsonpCallback: callbackName
            })
            .then(function (response) {
                console.log('loaded requirejs config: %o', response);
                var data = response;
                if (typeof(response) !== 'object') {
                    try {
                        data = JSON.parse(response);
                        if (!data) {
                            reject(new Error("Empty response!"));
                            return;
                        }
                    } catch (e) {
                        reject(e);
                        return;
                    }
                }

                var jsExtRegex = /\.js$/;
                var libPrefixRegex = /^lib\//;
                var miniFileSuffix = /[.-]min$/;

                // data: file => hash
                for (var file in data) {
                    if (data.hasOwnProperty(file) && jsExtRegex.test(file)) {
                        var hash = data[file];

                        // 去掉js的前缀
                        file = file.replace(jsExtRegex, '');

                        // 加上hash
                        var realFilePath = file + '_' + hash;

                        // 注意： lib目录是在上一级
                        if (libPrefixRegex.test(file)) {
                            config.paths[file] = '../' + realFilePath;
                            config.paths[file.replace(libPrefixRegex, '')] = '../' + realFilePath;
                        } else {
                            config.paths[file] = realFilePath;
                        }
                    }
                }

                // 如果非调试环境，则取压缩后的~
                if (!(window.Common && window.Common.env && window.Common.env.DEBUG)){
                    for (file in config.paths){
                        if (!config.paths.hasOwnProperty(file)){
                            continue;
                        }

                        if (miniFileSuffix.test(file)){
                            var originalFile = file.replace(miniFileSuffix, '');
                            config.paths[originalFile] = config.paths[file];
                            config.paths[originalFile.replace(libPrefixRegex, '')] = config.paths[file];
                        }
                    }
                }

                console.log('Final requirejs config: %o ', config);

                resolve(config);
            }, function (err) {
                reject(err);
            });
    });
}

