var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var child_process = require('child_process');

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
        if (config.ignoreFileTypes.indexOf(fileType) < 0){
            hashes[fileType] = addKeyValueToMap(hashes[fileType], urlPath, hash);
        }

        return callback(null, file);
    });
}

/**
 * 更新静态hash
 * @param hashes
 * @param config {*}
 */
function updateStaticsHashes(hashes, config) {
    var cmd, output;
    config = config || {};

    gutil.log("Begin update hashes: ", hashes);

    cmd = [config.phpPath || process.env.PHP_PATH, 'artisan', 'update-statics-map', '-v'].join(' ');
    gutil.log('> ' + cmd);

    output = child_process.execSync(cmd, {
        cwd: config.dynamicPath || process.env.DYNAMIC_PATH,
        input: JSON.stringify(hashes),
        timeout: 30 * 1000, // ms
    });

    gutil.log("OUTPUT: " + output);
    gutil.log("Finished update hashes.");
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
