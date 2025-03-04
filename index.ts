import { definePlugin, Context, Handler } from 'hydrooj'; // 确保导入Handler
import path from 'path';

class UserInfoHandler extends Handler {
    async get() {
        if (!this.user) {
            this.response.status = 401; // 未授权状态码
            this.response.body = { error: 'User not logged in' }; // 错误信息
            this.response.type = 'application/json'; // 设置响应类型
            return;
        }
        this.response.body = { uid: this.user._id }; // 设置响应体
        this.response.type = 'application/json'; // 设置响应类型
    }
}

export async function apply(ctx: Context) {
    // 提供静态资源服务
    //ctx.static('/ide', publicDir);

    // 注册路由重定向至你的SPA首页
    ctx.Route('ide_redirect', '/ide', class extends Handler {
        async get() {
            //const uid = this.user._id;
            //console.error(`uuuuuuuuuuuuuuuuuuuuuuuuid: ${this.user._id}`);
            //this.response.body = { uid };
            this.response.template = 'index.html'; // 重定向到你的SPA入口点
        }
    });

    // 可选：为更好的用户体验，也可以添加对'/ide/'（带斜杠）的支持
    ctx.Route('ide_redirect_slash', '/ide/', class extends Handler {
        async get() {
            this.response.redirect = '/ide/index.html';
        }
    });
    
    // 注册路由
    ctx.Route('user_info', '/api/user/info', UserInfoHandler);

    // 国际化支持
    ctx.i18n.load('en', {
        'Load IDE': 'Load IDE',
    });
    ctx.i18n.load('zh', {
        'Load IDE': '加载IDE',
    });
}
