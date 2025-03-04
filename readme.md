## 使用方法：

先按自己情况修改 `src/components/Main.vue`

然后编译这个项目，之后把 `dist` 文件夹内的所有东西复制到插件的 `templates` 里.



## 待修正

1. templates 里边的 static 要手动复制一些文件到 .hydro/static，估计直接放到 public 里能好，但是懒得折腾了，下次吧。

2. 左上角应该放个 logo，得修改 main.vue：`<a href="/"><img class="nav__logo" src="{{ ctx.setting.get('ui-default.nav_logo_dark') }}"></a>`
