@extends('layouts.main')

@section('content')
    <h3>Hello! This is {{$__view__}} page.</h3>
    <ul>
        @foreach ($pages as $page)
            <li><a href="{{$page['link']}}">{{$page['title']}}</a></li>
        @endforeach
    </ul>
@endsection

