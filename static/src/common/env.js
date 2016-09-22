// 定义环境变量 -- 合并gulp编译环境的和运行环境的

var env = __ENV__;

if (window.ENV){
    env = Object.assign(env || {}, window.ENV);
}

export default env;
