<?php

$ENV = array_merge([
    'DEBUG' => env('APP_DEBUG'),
], isset($ENV) ? $ENV : []);

$staticsManager = app()->statics;
$shimsForIe8ScriptUrl = $staticsManager->urlOfFile('lib/shims-for-ie8-debug.js');
$promisePolyfillScriptUrl = $staticsManager->urlOfFile('lib/promise-polyfill.js');
$localJQueryScriptUrl = $staticsManager->urlOfFile('lib/jquery.min.js');

?>
{{-- 有了jQuery还是很方便的，都引入一下吧： --}}
<script src="http://libs.baidu.com/jquery/1.9.1/jquery.min.js"></script>
{{-- 如果CDN的加载失败，则加载本地的 --}}
<script>if(!window.jQuery){document.write('<script src="{{$localJQueryScriptUrl}}" ' + '><' + '/script>');}</script>

<!--[if lt IE 9]>
    <script src="{{$shimsForIe8ScriptUrl}}"></script>
<![endif]-->


{{-- 如果浏览器不支持Promise，则引入Promise的修复方案 --}}
<script>if(!window.Promise){document.write('<script src="{{$promisePolyfillScriptUrl}}" ' + '><' + '/script>');}</script>


{{-- 定义环境变量，方便通过JS操作一些东东 --}}
<script>window.ENV = <?php echo json_encode(!empty($ENV) ? $ENV: null) ?>;</script>
