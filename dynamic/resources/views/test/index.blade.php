@extends('layouts.main')

@registerStatics(['js' =>  ['lib/requirejs.js']])

@section('content')
    <h3>Hello! This is {{$__view__}} page.</h3>
    <ul id="menu">
        @foreach ($pages as $page)
            <li><a href="{{$page['link']}}">{{$page['title']}}</a></li>
        @endforeach
    </ul>
@endsection

