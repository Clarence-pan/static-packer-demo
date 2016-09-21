@extends('layouts.main')

@registerStatics([
    'js' => ['lib/requirejs.js', 'lib/react.min.js']
])

@section('content')
    <h3>Hello! This is {{$__view__}} page.</h3>
@endsection

