import common from 'common';

export default class Dialog {
    static show(msg, title) {
        if (title){
            alert(title + "\n" + msg);
        } else {
            alert(msg);
        }
    }
}

// 支持在页面上通过amd的方式进行加载组件
console.log("[dialog]: export " + common.urlify(__NAMED__) + " => %o", Dialog);
common.amdExport(common.urlify(__NAMED__), Dialog);

