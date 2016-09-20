var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var child_process = require('child_process');
var request = require('request');
var _ = require('lodash');

/**
 * 收集hash的插件  -- 默认hash存放在文件名中： file_xxxx.js 这样的形式。
 * @param config 收集hash保存到哪个map中
 */
function gatherStaticsHashes(config) {
    if (!config || !config.to) {
        console.error("Invalid parameter <config.to>! It must be a valid object");
    }

    config.ignoreFileTypes = ['map'];

    var hashes = config.to;
    var PLUGIN_NAME = 'statics-hashes:gather';

    return through.obj(function (file, encoding, callback) {
        if (file.isNull()) {
            // nothing to do
            return callback(null, file);
        }

        //gutil.log(PLUGIN_NAME + " called! File.path=", file.path);
        var relativePath = file.path.substring(file.base.length).replace(/^[\/|\\]+/, '');
        var m = relativePath.match(/_([a-zA-Z0-9]+)\./);
        if (!m) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, "cannot resolve the hash from " + file.path));
            return callback(null, file);
        }

        var hash = m[1];
        var urlPath = relativePath.replace(m[0].substring(0, m[0].length - 1), '').replace(/\\/g, '/');
        var fileType = path.extname(file.path).toLowerCase().substring(1);

        // 只有不需要忽略的文件类型才需要收集hash信息
        if (config.ignoreFileTypes.indexOf(fileType) < 0) {
            hashes[fileType] = addKeyValueToMap(hashes[fileType], urlPath, hash);
        }

        return callback(null, file);
    });
}

/**
 * 更新静态hash
 * @param hashes
 * @param options {*}
 * @param done {function}
 */
function updateStaticsHashes(hashes, options, done) {
    var cmd;
    options = _.extend({
        phpPath: process.env.PHP_PATH,
        dynamicPath: process.env.DYNAMIC_PATH,
        apiType: process.env.UPDATE_STATICS_MAP_API_TYPE,
        apiUrl: process.env.UPDATE_STATICS_MAP_API_URL,
        apiKey: process.env.UPDATE_STATICS_MAP_API_KEY,
    }, options || {});

    if (Object.keys(hashes).length <= 0){
        gutil.log("No files updated.");
        done();
        return;
    }

    gutil.log("Updated files: " + formatUpdatedFilesHashes(hashes));

    if (options.apiType === 'shell') {
        cmd = [config.phpPath || process.env.PHP_PATH, 'artisan', 'update-statics-map', '-v'].join(' ');
        gutil.log('> ' + cmd);

        child_process.exec(cmd, {
            cwd: config.dynamicPath || process.env.DYNAMIC_PATH,
            input: JSON.stringify(hashes),
            timeout: 30 * 1000, // ms
        }, function(error, stdout, stderr){
            if (error !== null){
                gutil.log("Finished update hashes with error: ", error, " StdOut: ", stdout, " StdErr: ", stderr);
            } else {
                gutil.log("Finished update hashes successfully. StdOut: ", stdout, " StdErr: ", stderr);
            }

            done(error);
        });

    } else if (options.apiType === 'http') {
        request({
            method: 'POST',
            url: options.apiUrl,
            headers: {
                'X-API-Key': options.apiKey,
                'Content-Type': 'application/json',
                'Accept': '*/json,*/*',
            },
            body: JSON.stringify(hashes)
        }, function(error, response, body){
            if (error){
                gutil.log("Finished update hashes with error: ", error, " response-body: ", body);
            } else {
                try{
                    var responseData = JSON.parse(body);
                    if (responseData.success){
                        gutil.log("Finished update hashes successfully. response-body: ", body);
                    } else {
                        error = new Error(responseData.message);
                        gutil.log("Finished update hashes with internal error: ", error, " response-body: ", body);
                    }
                } catch (e){
                    error = e;
                    gutil.log("Finished update hashes with data format error: ", error, " response-body: ", body);
                }

            }

            done(error);
        });
    } else {
        throw new Error("Invalid API TYPE for statics hashes! Type=" + options.apiType);
    }
}

function formatUpdatedFilesHashes(hashes){
    var type = typeof hashes;
    if (type === 'undefined'){
        return 'undefined';
    } else if (type === 'object' && hashes === null){
        return 'null';
    }

    var output = [];
    var filesCount = 0;

    for (var fileType in hashes) {
        if (!hashes.hasOwnProperty(fileType)){
            continue;
        }

        output.push("    " + fileType + ":");

        var files = hashes[fileType];
        for (var file in files){
            if (!files.hasOwnProperty(file)){
                continue;
            }

            output.push('        ' + file + ': ' + files[file]);
            filesCount++;
        }
    }

    output.unshift(filesCount + " files updated:");

    return output.join("\n");
}


function addKeyValueToMap(map, key, value) {
    if (!map) {
        map = {};
    }

    map[key] = value;

    return map;
}

module.exports = {
    gather: gatherStaticsHashes,
    update: updateStaticsHashes,
};
