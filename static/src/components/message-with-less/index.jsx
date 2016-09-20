import common from 'common';
import React from 'react';
import './index.less';

export default class Message extends React.Component {
    render(){
        return (
            <div className="message">Hello! This is a message with style wroten in less</div>
        );
    }
}

// 支持在页面上通过amd的方式进行加载组件
common.amdExport(common.urlify(__NAMED__), Message);

