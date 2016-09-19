@extends('layouts.basic')

@registerStatics([
    'css' => ['common.css'],
    'js' =>  [
        'lib/common.js?v1',
        'common.js?amd=on',
        'lib/requirejs.js?v1',
     ],
])

@if (empty($dontRegisterDefaultStatics))
    @registerDefaultStatics()
@endif

@section('styles')
    @loadRegisteredStatics('css')
@endsection

@section('scripts')
    <!--[if lt IE 9]>
        @importScripts('lib/shims-for-ie8.js?v3')
    <![endif]-->

    <script>window.STATIC_SERVER = <?php echo json_encode(env('STATICS_SERVER')) ?>;</script>
    @loadRegisteredStatics('js')
@endsection

@section('body')
    <div id="content">@yield('content')</div>
@endsection


