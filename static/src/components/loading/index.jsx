import Q from 'common';
import React from 'react';
import loadingImg from './loading.gif';

export default class Component extends React.Component {
    render(){
        return (
            <div className="loading">
                <img src={loadingImg} alt="loading..." />
            </div>
        );
    }
}

//支持在页面上通过amd的方式进行加载组件
Q.amdExport(Q.urlify(__NAMED__), Component);

