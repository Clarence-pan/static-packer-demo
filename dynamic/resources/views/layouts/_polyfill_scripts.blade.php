<?php

$staticsManager = app()->statics;
$shimsForIe8ScriptUrl = $staticsManager->urlOfFile('lib/shims-for-ie8-debug.js?v10');
$promisePolyfillScriptUrl = $staticsManager->urlOfFile('lib/promise-polyfill.js?v10');


?>
<!--[if lt IE 9]>
    <script src="{{$shimsForIe8ScriptUrl}}"></script>
<![endif]-->


{{-- 如果浏览器不支持Promise，则引入Promise的修复方案 --}}
<script>if (!window.Promise){document.write('<script src="{{$promisePolyfillScriptUrl}}" ' + '><' + '/script>');}</script>

<script>console.log("window.promise=" + typeof window.Promise);</script>

{{-- 定义域名，方便通过JS操作一些东东 --}}
<script>window.STATIC_SERVER = <?php echo json_encode(env('STATICS_SERVER')) ?>;</script>
