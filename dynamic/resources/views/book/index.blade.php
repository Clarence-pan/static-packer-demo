@extends('layouts.main')

@registerStatics([
    'js' => ['lib/requirejs.js', 'lib/react.min.js']
])

@section('content')
    <h3>Hello! This is product index page.</h3>
@endsection

