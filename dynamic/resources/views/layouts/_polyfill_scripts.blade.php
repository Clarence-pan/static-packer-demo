<?php

$staticsManager = app()->statics;
$shimsForIe8ScriptUrl = $staticsManager->urlOfFile('lib/shims-for-ie8-debug.js?v20');
$promisePolyfillScriptUrl = $staticsManager->urlOfFile('lib/promise-polyfill.js?v20');
$localJQueryScriptUrl = $staticsManager->urlOfFile('lib/jquery.min.js?v20');

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


{{-- 定义域名，方便通过JS操作一些东东 --}}
<script>window.STATIC_SERVER = <?php echo json_encode(env('STATICS_SERVER')) ?>;</script>
