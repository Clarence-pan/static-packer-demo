import 'babel-polyfill';

export default class Common {
    static log(msg) {
        if (console && console.log){
            console.log("[" + (new Date()).toISOString() + "]" + msg);
        }
    }
}

// export Common to global common.
if (typeof window !== 'undefined'){
    window.Common = Common;
}
