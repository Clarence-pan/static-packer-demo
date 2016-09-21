import Q from 'common';
import React from 'react';
import './index.less';
import treeImage from './tree.jpg';

export default class Component extends React.Component {
    render(){
        return (
            <div className="image-wrapper">
                <h3>Here is an image:</h3>
                <img className="image" src={treeImage} alt="tree" />
                <p>注意：import一个图片会让这个图片变成base64编码的data-url，对于小图片还可以，不推荐import大图片 -- 建议将大图片放到专门的CDN上。</p>
            </div>
        );
    }
}

//支持在页面上通过amd的方式进行加载组件
Q.amdExport(Q.urlify(__NAMED__), Component);

