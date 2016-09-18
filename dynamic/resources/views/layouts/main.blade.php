@extends('layouts.basic')

@registerStatics([
    'css' => ['lib/common.css'],
    'js' =>  ['lib/jquery.js', 'lib/underscore.js', 'lib/common.js'],
])

@if (empty($dontRegisterDefaultStatics))
    @registerDefaultStatics()
@endif

@section('styles')
    @loadStatics('css')
@endsection

@section('scripts')
    @loadStatics('js')
@endsection

@section('body')
    <div id="content">@yield('content')</div>
@endsection


