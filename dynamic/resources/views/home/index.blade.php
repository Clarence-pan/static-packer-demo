@extends('layouts.main')

@registerStatics(['js' =>  ['lib/requirejs.min.js']])

@section('content')
    <h3>Hello! This is home page.</h3>
    <div>
        <a href="/test">More tests are at here.</a>
    </div>
@endsection

