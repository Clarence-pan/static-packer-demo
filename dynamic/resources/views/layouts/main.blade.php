@extends('layouts.basic')

@registerStatics([
    'css' => ['common.css'],
    'js' =>  [
        'lib/common.js',
        'common.js',
        'lib/requirejs.js',
     ],
])

@if (empty($dontRegisterDefaultStatics))
    @registerDefaultStatics()
@endif

@section('styles')
    @loadRegisteredStatics('css')
@endsection

@section('scripts')
    @include('layouts._polyfill_scripts')
    @loadRegisteredStatics('js')
@endsection

@section('nothing')
@endsection

@section('body')
    <div id="content">@yield('content')</div>
@endsection


