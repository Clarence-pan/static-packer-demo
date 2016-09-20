var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var _ = require('lodash');

/**
 * 替换常量
 */
function replaceConsts(options) {
    options = _.extend({
        base: null, // 基础路径
        only: null, // 只匹配哪些文件 -- 用正则表达式匹配文件路径
        except: null, // 排除哪些文件 -- 正则表达式匹配文件路径
        consts: function(file) {
            var filePath = path.resolve(file.srcPath || file.path);
            var fileDir = path.dirname(filePath);
            var baseDir = options.base || path.resolve(file.base);
            var relativePath = path.relative(baseDir, filePath);
            var relativeDir = path.dirname(relativePath);
            var named = file.named;

            return {
                __FILE__: JSON.stringify(filePath),
                __DIR__: JSON.stringify(fileDir),
                __BASE_DIR__: JSON.stringify(baseDir),
                __RELATIVE_PATH__: JSON.stringify(relativePath),
                __RELATIVE_DIR__: JSON.stringify(relativeDir),
                __NAMED__: JSON.stringify(named),
                __DEBUG__: JSON.stringify(process.env)
            };
        },
        extraConsts: function(){}
    }, options);


    var PLUGIN_NAME = 'replace-consts';

    return through.obj(function(file, encoding, callback) {
        var self = this;

        if (!file || file.isNull()) {
            return callback(null, file);
        }

        // 判断是否只匹配某些文件
        if (options.only && !options.only.test(file.path)){
            return callback(null, file);
        }

        // 判断是否排除某些文件
        if (options.except && options.except.test(file.path)){
            return callback(null, file);
        }

        // 暂时只支持buffer类型的文件 -- TODO: 对stream类型的文件的处理
        if (!file.isBuffer()){
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, "Only buffer file supported. This is not a buffer file: " + file.path));
            return callback(null, file);
        }

        var consts = _.extend(options.consts(file), options.extraConsts(file));

        var fileContents = file.contents.toString();
        var newContents = fileContents.replace(/__[0-9a-zA-Z_]+__/g, function(x){
            return x in consts ? consts[x] : x;
        });

        file.contents = new Buffer(newContents);

        return callback(null, file);
    });

}

module.exports = replaceConsts;


function dir(obj, onlyOwned) {
    if (obj === null) {
        return '<null>';
    } else if (typeof obj === 'undefined') {
        return '<undefined>';
    }

    var keys = {};
    for (var k in obj) {
        if (!obj.hasOwnProperty(k) && onlyOwned) {
            continue;
        }

        var v = obj[k];
        if (typeof v === 'function') {
            keys[k] = '<function>';
        } else if (typeof v === 'object') {
            keys[k] = '<object>';
        } else {
            keys[k] = v;
        }
    }

    return keys;
}
