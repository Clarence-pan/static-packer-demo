@extends('layouts.basic')

@registerStatics([
    'css' => ['common.css'],
    'js' =>  ['lib/jquery.js', 'common.js'],
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


