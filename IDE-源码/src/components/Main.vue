<template>
  <div :class="'main ' + (theme != 'vs' ? 'dark' : 'vs')">
    <el-container>
      <el-header
        :height="barHeight + 'px'"
        style="border-bottom: 1px solid rgba(144, 147, 153, 0.3); user-select: none"
      >
        <div
          class="bar"
          :style="{ height: barHeight + 'px', lineHeight: barHeight + 'px' }"
        >
          <transition name="el-fade-in-linear">
            <div
              v-show="formated"
              :style="{
                height: barHeight + 'px',
                lineHeight: barHeight + 'px',
                float: 'left',
              }"
              class="items format_tip_div"
            >
              <div
                :class="{
                  format_tip: theme == 'vs',
                  format_tip_dark: theme != 'vs',
                }"
              >
                <span>格式化完成，请确认：</span>
                <i
                  class="el-icon-check"
                  title="确认"
                  style="margin-left: 5px; color: #67c23a; cursor: pointer"
                  @click="(formated = false), clearTimeout_(formatTip)"
                ></i>
                <i
                  class="el-icon-refresh-left"
                  title="撤销"
                  style="margin-left: 10px; color: #f56c6c; cursor: pointer"
                  @click="
                    (formated = false),
                      (code = code__),
                      clearTimeout_(formatTip)
                  "
                ></i>
              </div>
            </div>
          </transition>
          <div class="items" :style="{ float: 'right' }">
            <el-tooltip
              class="item"
              effect="dark"
              content="运行代码"
              placement="bottom"
            >
              <div class="btn_settings btn run" @click="debug">
                <i v-if="ondebug" class="el-icon-loading"></i>
                <i v-else class="el-icon-caret-right"></i>
              </div>
            </el-tooltip>
            <el-tooltip
              class="item"
              effect="dark"
              :content="fileIOMode ? 'Standard IO' : 'File IO'"
              placement="bottom"
            >
              <div
              v-if="!fileIOMode"
                class="btn_settings btn"
                @click="fileIOMode = true"
              >
                <i class="el-icon-document"></i>
              </div>
              <div
              v-else
                class="btn_settings btn"
                @click="fileIOMode = false"
              >
                <i class="el-icon-edit-outline"></i>
              </div>
            </el-tooltip>
            <el-popover placement="top" width="160" trigger="click">
              <div style="text-align: center; user-select: none">
                <el-button type="text" @click="read">打 开</el-button>
                <el-button type="text" @click="saveToLocal(code, 0)">保 存</el-button>
              </div>
              <div slot="reference" class="btn_settings btn">
                <i class="el-icon-folder"></i>
              </div>
            </el-popover>
            <el-tooltip
              class="item"
              effect="dark"
              content="帮助信息"
              placement="bottom"
            >
              <div
                class="btn_settings btn"
                @click="helpDialogVisible = !helpDialogVisible"
              >
                <i class="el-icon-warning-outline"></i>
              </div>
            </el-tooltip>

            <el-tooltip
              class="item"
              effect="dark"
              content="设置"
              placement="bottom"
            >
              <div
                class="btn_settings btn"
                @click="settingsDialogVisible = !settingsDialogVisible"
              >
                <i class="el-icon-setting"></i>
              </div>
            </el-tooltip>
          </div>
        </div>
      </el-header>
      <el-container>
        <el-main>
          <div class="editor_div">
            <MonacoEditor
              v-show="!diff"
              :style="{ height: height + 'px', width: '100%' }"
              ref="manoco"
              v-model="code"
              :theme="theme"
              :language="mode"
              :options="options"
              @editorWillMount="manocoWillMountHandler"
              @editorDidMount="manocoMountHandler"
            />
            <MonacoEditor
              ref="manoco_diff"
              v-show="diff"
              :style="{ height: height + 'px', width: '100%' }"
              :language="mode"
              :options="options"
              :diffEditor="true"
              :value="code"
              :original="code_"
              @change="diffChangeHandler"
            />
          </div>
        </el-main>
        <el-aside
          :width="debug_width + 'px'"
          :style="{ width: debug_width + 'px' }"
        >
        <div class="stdIO" v-show="!fileIOMode">
          <el-container>
            <div class="area_tip">
              Stdin
              <i
                v-show="stdin"
                style="margin-left: 10px; cursor: pointer; color: #e6a23c"
                @click="clearStdin"
                title="清空"
                class="el-icon-delete"
              />
            </div>
            <el-header
              style="border-bottom: 1px solid rgba(144, 147, 153, 0.3)"
              :height="height - barHeight - debug_output_height + 'px'"
            >
              <el-input
                spellcheck="false"
                :style="{
                  overflow: 'auto',
                  fontSize: stdinSize + 'px'
                }"
                type="textarea"
                resize="none"
                v-model="stdin"
                @focus="autoSelectStdin"
              >
              </el-input>
            </el-header>
            <div
              class="area_tip"
              style="border-top: 1px solid rgba(144, 147, 153, 0.3)"
            >
              Stdout
              <i
                v-show="stdout"
                style="margin-left: 10px; cursor: pointer; color: #e6a23c"
                @click="stdout = ''"
                title="清空"
                class="el-icon-delete"
              />
            </div>
            <el-main
              :style="{
                height: debug_output_height - 20 + 'px',
                overflow: 'hidden',
              }"
            >
              <MonacoEditor
                v-if="debug_width > 0 && !fileIOMode"
                :style="{
                  height: debug_output_height - 20 + 'px',
                  width: debug_width,
                  padding: '8px 0',
                }"
                ref="stdout"
                v-model="stdout"
                :theme="theme"
                :language="mode"
                :options="{
                  fontSize: stdoutSize,
                  lineNumbers: 'off',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 14,
                  lineNumbersMinChars: 0,
                  wordWrap: true,
                  readOnly: true,
                  glyphMargin: false,
                  overviewRulerBorder: false,
                  minimap: {
                    enabled: false,
                  },
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8,
                  },
                }"
              />
            </el-main>
          </el-container>
        </div>
        <div class="fileIO"  style="padding: 20px" v-show="fileIOMode">
          <p style="font-size: 18px; font-weight: bold">输入：</p>
          <el-upload
          v-if="stdinIOInfo.content.length == 0"
            drag
            action=""
            :on-change="fileUpload"
            :show-file-list='false'
            :auto-upload="false">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
          <div v-else>
            <el-tag>{{ stdinIOInfo.name }}</el-tag><el-tag type="info" style="margin-left: 10px">{{ stdinIOInfo.size }}</el-tag>
            <el-button type="text" style="color: red" @click="stdinIOInfo.content = ''">删 除</el-button>
            <pre>{{ stdinIOInfo.content.length > fileIOLimit ? stdinIOInfo.content.slice(0, fileIOLimit) + '...' : stdinIOInfo.content }}</pre>
          </div>
          <p style="font-size: 18px; font-weight: bold">输出：</p>
          <pre style="color: lightgray" v-if="cost.length == 0">未运行</pre>
          <pre>{{ stdout.length > fileIOLimit ? stdout.slice(0, fileIOLimit) + '...' : stdout }}</pre>
          <pre>{{ cost }}</pre>
          <div v-if="stdout.length > fileIOLimit">
            <el-button type="text" @click="saveToLocal(stdout, 1)">下载输出数据</el-button>
            <!-- <el-button type="text">对 比</el-button> -->
          </div>
        </div>
        </el-aside>
      </el-container>
    </el-container>
    <el-dialog
      title="设置"
      :visible.sync="settingsDialogVisible"
      custom-class="settingsDialog"
      width="40%"
    >
      <div style="padding: 0 10px">
        <el-row :span="24">
          <el-col :span="12"
            ><p>语言</p>
            <el-select v-model="mode" size="small" style="max-width: 120pt">
              <el-option :key="0" :label="'C++ (GCC 9.2.0)'" :value="'cpp'">
              </el-option>
              <el-option :key="1" :label="'Python (3.8.1)'" :value="'python'">
              </el-option> </el-select
          ></el-col>
          <el-col :span="12" style="padding-left: 10px">
            <p>
              服务器IP<i
                style="margin-left: 10px; cursor: pointer; color: #e6a23c"
                @click="server_judger = default_server"
                title="重置"
                class="el-icon-refresh-left"
              />
            </p>
            <el-input
              ref="server"
              placeholder="请输入内容"
              v-model="server_judger"
              size="small"
            >
            </el-input>
          </el-col>
        </el-row>
        <el-row>
          <p>主题</p>
          <el-col>
            <el-select
              v-model="theme"
              placeholder="请选择"
              style="max-width: 120pt"
            >
              <el-option key="1" label="浅色" value="vs"> </el-option>
              <el-option key="2" label="深色" value="vs-dark"> </el-option>
            </el-select>
          </el-col>
        </el-row>
        <div>
          <br>
          <span>代码编辑器字号</span>
          <el-slider v-model="options.fontSize" :min="10" :max="50"></el-slider>
          <br>
          <el-row>
            <el-col :span="10">
              输入信息字号
              <el-slider v-model="stdinSize" :min="10" :max="50"></el-slider>
            </el-col>
            <el-col :span="4">&nbsp;</el-col>
            <el-col :span="10">
              输出信息字号
              <el-slider v-model="stdoutSize" :min="10" :max="50"></el-slider>
            </el-col>
          </el-row>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="settingsDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
    <el-dialog title="提示" :visible.sync="helpDialogVisible" width="40%">
      <h4>关于</h4>
      <p>编辑器支持C++、Python代码高亮及运行</p>
      <p>
        GitHub：<el-link type="primary" @click="go"
          >https://github.com/Fromnowon/IDE</el-link
        >
      </p>
      <h4>快捷键</h4>
      <p><span style="color: #409eff">F9</span> - 运行代码</p>
      <p><span style="color: #409eff">Ctrl + F</span> - 查找，替换</p>
      <p><span style="color: #409eff">Ctrl + Enter</span> - 下方插入一行</p>
      <p></p>
      <p><span style="color: #409eff">Ctrl + \</span> - 拆分编辑器</p>
      <p>
        <span style="color: #409eff">Shift + Alt + F</span> - 格式化代码<span
          style="color: red"
          >（测试功能，慎用）</span
        >
      </p>
    </el-dialog>
    <input
      ref="readInput"
      type="file"
      accept=".cpp, .py"
      @change="loadFile"
      style="display: none"
    />
    <div
      class="resize_debug"
      :style="{
        top: height - barHeight - debug_output_height + 2 * 24 + 'px',
        left: width - debug_width - 30 + 'px',
      }"
    >
      <i v-if="debug_width" class="el-icon-d-arrow-right"></i>
      <i v-else class="el-icon-d-arrow-left"></i>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import { js_beautify } from "js-beautify";
import MonacoEditor from "vue-monaco";
const Base64 = require("js-base64").Base64;
import { Loading } from "element-ui";

export default {
  name: "Main",
  components: {
    MonacoEditor,
  },
  data() {
    return {
      editor: "",
      editor_diff: "",
      width: null,
      height: null,
      theme: "vs",
      code: "",
      code__: "",
      code_: "",
      diff: false,
      stdin: "",
      stdinIOInfo: {
        name: '',
        size: '',
        content: ''
      },
      cost: '',
      fileIOLimit: 50, // 限制文件IO模式预览数据长度
      stdinSize: 16,
      stdout: "",
      stdoutSize: 16,
      token: "",
      mode: "cpp",
      server_judger: "http://127.0.0.1",
      server_lib: "",
      default_server: "http://127.0.0.1",
      hints: [], // 关键词
      fun_hints_key: [], // 函数名
      fun_hints: {}, // 函数补全
      decorations: [], // 错误行标记
      ondebug: false,
      fileIOMode: false, // 输入输出模式
      tip: null,
      barHeight: 32,
      loadingInstance: null,
      settingsDialogVisible: false,
      helpDialogVisible: false,
      debug_width: 400,
      debug_output_height: 600,
      formated: false,
      formatTip: null,
      options: {
        fontSize: 18,
        tabSize: 4,
        roundedSelection: false,
      },
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      if (/windows phone|iphone|android/gi.test(window.navigator.userAgent)) {
        //h5
        alert("IDE布局未适配移动端，请谨慎使用");
      }
      this.resize();
      window.onresize = () => {
        this.editor.layout();
        this.resize(); // 动态调整高度
      };
      window.onbeforeunload = () => {
        this.save();
      };
      this.dragLoadFileInit();
      this.initDrag();
      // 初始化
      this.loadConf();
      //this.$nextTick(() => {
        //this.loadingInstance = Loading.service({
          //ock: true,
         // text: "初始化中",
          //fullscreen: true,
          //background: this.theme == "vs" ? "" : "rgba(0, 0, 0, 0.7)",
        //});
      //});
    },
    diffChangeHandler(v, e) {
      this.code = v;
    },
    manocoWillMountHandler(monaco) {
      window.monaco = monaco;
    },
    manocoMountHandler(editor) {
      this.editor = editor;
      // 全局绑定f9
      window.addEventListener("keydown", (e) => {
        if (e.keyCode == 120) {
          //调试
          e.preventDefault();
          this.debug();
        }
        if (e.ctrlKey && e.keyCode == 220) {
          e.preventDefault();
          this.diff = !this.diff;
        }
      });

      // 菜单，快捷键
      const arr = [
        {
          id: "1", // 菜单项 id
          label: "Run", // 菜单项名称
          keybindings: [window.monaco.KeyCode.F9], // 绑定快捷键
          contextMenuGroupId: "1_modification", // 所属菜单的分组
          run: () => {
            this.debug();
          }, // 点击后执行的操作
        },
        {
          id: "2", // 菜单项 id
          label: "Format", // 菜单项名称
          keybindings: [
            window.monaco.KeyMod.Alt |
              window.monaco.KeyMod.Shift |
              window.monaco.KeyCode.KEY_F,
          ],
          contextMenuGroupId: "1_modification", // 所属菜单的分组
          run: () => {
            clearTimeout(this.formatTip); // 可能在倒计时内多次格式化
            this.code__ = this.code;
            this.formated = true;
            this.code = js_beautify(this.code, {
              indent_size: 4,
              brace_style: "collapse,preserve-inline",
              space_before_conditional: true,
              max_preserve_newlines: 2,
              wrap_attributes: "auto",
            });
            this.formatTip = setTimeout(() => {
              this.formated = false;
            }, 30000);
          },
        },
        {
          id: "3", // 菜单项 id
          label: "Clear Markers", // 菜单项名称
          contextMenuGroupId: "1_modification", // 所属菜单的分组
          run: () => {
            this.clearMarkers();
          },
        },
      ];
      for (let i = 0; i < arr.length; i++) editor.addAction(arr[i]);

      // 请求数据
      /*
      axios
        .get("https://" + this.server_lib + "/ide.json?" + Date.now())
        .then((res) => {
          this.hints = res.data.keywords;
          this.server_judger = this.default_server = res.data.server;
          const functions = res.data.snippets;
          this.fun_hints = functions;
          for (let key in functions) this.fun_hints_key.push(key);
          this.initCompletion();
          this.$nextTick(() => {
            // 以服务的方式调用的 Loading 需要异步关闭
            setTimeout(() => {
              this.loadingInstance.close();
            }, 1000);
          });
        });
        */

      // 清除错误标记
      editor.onKeyDown((e) => {
        const startLineNumber = this.editor.getSelection().startLineNumber;
        const endLineNumber = this.editor.getSelection().endLineNumber;
        const model = this.editor.getModel();

        const arr = model.getLinesDecorations(startLineNumber, endLineNumber);
        arr.map((ds) => {
          if (this.decorations.includes(ds.id)) {
            model.deltaDecorations([ds.id], []);
          }
        });
      });
    },
    clearTimeout_(ins) {
      clearTimeout(ins);
    },
    initDrag() {
      const _this = this;
      const obj = document.querySelector(".resize_debug");
      obj.onmousedown = function (e) {
        e.preventDefault();
        var e = e || window.event; // 兼容 IE
        // 鼠标点击物体那一刻相对于物体左侧边框的距离=点击时的位置相对于浏览器
        // 最左边的距离-物体左边框相对于浏览器最左边的距离，纵向同理
        var divX = e.clientX - this.offsetLeft;
        var divY = e.clientY - this.offsetTop;

        if (obj.setCapture) {
          obj.setCapture(); // 修复低版本 IE bug
        }
        document.onmousemove = function (e) {
          var e = e || window.event;

          var disX = e.clientX - divX;
          var disY = e.clientY - divY;

          // 控制拖拽物体的范围只能在浏览器视窗内，不允许出现滚动条或拖出可视区域
          if (disX < 0) {
            disX = 0;
          } else if (
            disX >
            document.documentElement.clientWidth - obj.offsetWidth
          ) {
            disX = document.documentElement.clientWidth - obj.offsetWidth;
          }

          if (disY < 0) {
            disY = 0;
          } else if (
            disY >
            document.documentElement.clientHeight - obj.offsetHeight
          ) {
            disY = document.documentElement.clientHeight - obj.offsetHeight;
          }

          // 移动时重新得到物体的距离，解决拖动时出现晃动现象
          const minWidth = 100;
          _this.debug_width =
            _this.width - disX - divX - 20 > 1000
              ? 1000
              : _this.width - disX - divX - 20 <= minWidth
              ? minWidth
              : _this.width - disX - divX - 20;
          let n_height = _this.height - disY - divY + _this.barHeight + 10;
          _this.debug_output_height =
            n_height > _this.height * 0.8
              ? _this.height * 0.8
              : n_height < _this.height * 0.2
              ? _this.height * 0.2
              : n_height;
          _this.resize();
          document.onmouseup = function () {
            if (_this.debug_width <= minWidth) {
              _this.debug_width = 0;
              _this.resize();
            }
            // 鼠标抬起时不再移动
            // 预防鼠标弹起来后还会循环（即预防鼠标放上去的时候还会移动）
            document.onmousedown = document.onmousemove = null;
            if (obj.releaseCapture) {
              obj.releaseCapture(); // 修复低版本 IE bug
            }
          };
        };
      };
    },
    initCompletion() {
      // 为该语言注册一个语言提示器--联想
      const that = this;
      let createCompleters = (textUntilPosition) => {
        const monaco = window.monaco;
        //过滤特殊字符
        let _textUntilPosition = textUntilPosition
          .replace(/[\*\[\]@\$\(\)]/g, "")
          .replace(/(\s+|\.|\<|\>)/g, " "); // 以+ . # < >分割字符串
        //切割成数组
        let arr = _textUntilPosition.split(" ");
        //取当前输入值
        let activeStr = arr[arr.length - 1];
        //获得输入值的长度
        let len = activeStr.length;

        //获得编辑区域内已经存在的内容
        let rexp = new RegExp("([^\\w]|^)" + activeStr + "\\w*", "gim");
        let match = that.code.match(rexp);
        let _hints = !match
          ? []
          : match.map((ele) => {
              let rexp = new RegExp(activeStr, "gim");
              let search = ele.search(rexp);
              return ele.substr(search);
            });

        //查找匹配当前输入值的元素
        let hints = Array.from(
          new Set([...that.hints, ...that.fun_hints_key, ..._hints])
        )
          .sort()
          .filter((ele) => {
            let rexp = new RegExp(ele.substr(0, len), "gim");
            return (match && match.length === 1 && ele === activeStr) ||
              ele.length === 1
              ? false
              : activeStr.match(rexp);
          });
        //添加内容提示
        let res = hints.map((ele) => {
          if (that.hints.indexOf(ele) > -1) {
            // 匹配关键字
            return {
              label: ele,
              kind: monaco.languages.CompletionItemKind.Keyword,
              documentation: ele,
              insertText: ele,
            };
          } else if (that.fun_hints_key.indexOf(ele) > -1) {
            // 匹配函数
            return {
              label: ele,
              kind: monaco.languages.CompletionItemKind.Function,
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: ele,
              insertText: that.fun_hints[ele],
            };
          } else {
            // 否则加入本地
            return {
              label: ele,
              kind: monaco.languages.CompletionItemKind.Text,
              documentation: ele,
              insertText: ele,
            };
          }
        });
        return res;
      };
      window.monaco.languages.registerCompletionItemProvider("cpp", {
        provideCompletionItems(model, position) {
          var textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });
          var suggestions = createCompleters(textUntilPosition);
          return {
            suggestions: suggestions,
          };
        },
      });
    },
    clearStdin() {
      this.stdin = "";
    },
    autoSelectStdin(Event) {
      // stdin获取焦点自动全选
      Event.target.select();
    },
    saveToLocal(cont, type) {
      //定义文件内容，类型必须为Blob 否则createObjectURL会报错
      let content = new Blob([cont]);
      //生成url对象
      let urlObject = window.URL || window.webkitURL || window;
      let url = urlObject.createObjectURL(content);
      //生成<a></a>DOM元素
      let el = document.createElement("a");
      //链接赋值
      el.href = url;
      let fname = '';
      if (type == 0) {
        fname =
          "code-" +
          moment(new Date()).format("YYYY-MM-DD HH:mm:ss") +
          (this.mode == "cpp" ? ".cpp" : ".py");
      }else fname = 
          "output-" +
          moment(new Date()).format("YYYY-MM-DD HH:mm:ss") +
          '.out'
      el.download = fname;
      //必须点击否则不会下载
      el.click();
      //移除链接释放资源
      urlObject.revokeObjectURL(url);
    },
    read() {
      this.$refs.readInput.click();
    },
    loadFile(event) {
      var input = event.target;
      var reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          //显示文件内容
          this.editor.setValue(reader.result);
          event.target.value = "";
        }
      };
      reader.readAsText(input.files[0]);
    },
    dragLoadFileInit() {
      // 获取目标元素
      var box = document.querySelector(".editor_div");
      // (1)需要解决一旦拖拽外部文件就覆盖掉当前页面的问题
      //  解决：给document绑定drop事件
      //  drop事件默认触发不了，需要在dragover事件里面阻止默认事件
      document.ondrop = (e) => {
        e.preventDefault();
      };
      // 这个阻止默认事件是为了让drop事件得以触发
      document.ondragover = (e) => {
        e.preventDefault();
      };
      let _this = this;
      box.ondrop = (e) => {
        // 得到拖拽过来的文件
        var dataFile = e.dataTransfer.files[0];
        // FileReader实例化
        if (dataFile == undefined) return;
        var fr = new FileReader();
        // 读取完毕之后执行
        fr.onload = () => {
          // 获取得到的结果
          this.editor.setValue(fr.result);
          e.target.value = "";
        };
        // 异步读取文件
        fr.readAsText(dataFile);
      };
    },
    saveCode() {
      let code = Base64.encode(this.code);
      localStorage.setItem("zzh_code", code); // 保存代码
    },
    save() {
      this.saveCode();
      localStorage.setItem("zzh_fontsize", this.options.fontSize); // 保存字号
      localStorage.setItem("zzh_fontsize1", this.stdinSize); // 保存字号1
      localStorage.setItem("zzh_fontsize2", this.stdoutSize); // 保存字号2
      localStorage.setItem("zzh_stdin", this.stdin); // 保存字号
      localStorage.setItem("zzh_lang", this.mode); // 保存语言
      localStorage.setItem("zzh_theme", this.theme); // 保存主题
      localStorage.setItem("zzh_debug_width", this.debug_width); // 保存布局
      console.log("saved");
    },
    loadConf() {
      // 读取信息
      const code = localStorage.getItem("zzh_code");
      if (code) this.code = Base64.decode(code);
      this.stdin = localStorage.getItem("zzh_stdin") || "";
      this.options.fontSize =
        parseInt(localStorage.getItem("zzh_fontsize")) || 18;
      this.stdinSize =
        parseInt(localStorage.getItem("zzh_fontsize1")) || 14;
      this.stdoutSize =
        parseInt(localStorage.getItem("zzh_fontsize2")) || 14;
      this.mode = localStorage.getItem("zzh_lang") || "cpp";
      this.$nextTick(() => {
        this.theme = localStorage.getItem("zzh_theme") || "vs";
      });
      const d = localStorage.getItem("zzh_debug_width");
      if (d && d != "NaN") this.debug_width = parseInt(d);
    },
    
   
    
    debug() {
  if (this.code.trim().length == 0) {
    this.$message.error("代码不能为空");
    return;
  }
  if (this.ondebug) return;
  if (!this.debug_width) this.debug_width = 400;

  this.clearMarkers();
  // 提交提示
  this.tip = this.$message({
    dangerouslyUseHTMLString: true,
    message: "<strong>处理中，请稍等...</strong>",
    duration: 0,
    center: true,
  });

  const _this = this;
  _this.ondebug = true;
  _this.stdout = "";
  _this.cost = "";

  // 准备数据
  const code = this.code; // 去掉 Base64 编码
  let input = this.fileIOMode ? this.stdinIOInfo.content : this.stdin;
  if (input[input.length - 1] !== "\n") input += "\n";

  // 使用 POST 提交数据
  axios
    .post(
      _this.server_judger + "/p/1/submit", // 提交地址
      {
        code: code,
        lang: _this.mode == "cpp" ? "cc.cc14o2" : "py", // 语言
        input: input,
        pretest: true,
      },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          // 如果需要认证，可以在这里添加 cookies 或 token
        },
      }
    )
    .then((response) => {
      // 提交成功后，启动 WebSocket 连接
      _this.startWebSocketConnection();
    })
    .catch((error) => {
      console.error("提交失败:", error);
      _this.ondebug = false;
      _this.tip.close();
      this.$alert("提交失败，请检查网络或服务器状态", "错误", {
        confirmButtonText: "确定",
        type: "error",
      });
    });
},

startWebSocketConnection() {
  const _this = this;

  // WebSocket 连接
  const ws = new WebSocket(`ws://127.0.0.1/record-conn?pretest=1&uidOrName=2&pid=1&domainId=system`);

  ws.onopen = () => {
    console.log("WebSocket 连接已建立");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.rdoc) {
      const result = data.rdoc;
      _this.handleWebSocketResult(result); // 处理结果
      
      // 根据状态更新 stdin
      //_this.updateStdoutByStatus(result.status);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket 错误:", error);
    _this.ondebug = false;
    _this.tip.close();
    this.$alert("WebSocket 连接异常", "错误", {
      confirmButtonText: "确定",
      type: "error",
    });
  };

  ws.onclose = () => {
    console.log("WebSocket 连接关闭");
    _this.ondebug = false;
    _this.tip.close();
  };
},

handleWebSocketResult(result) {
  const _this = this;
  _this.tip.close();
  _this.ondebug = false;

  if (result.status === 1) { // STATUS_ACCEPTED
    // 处理成功结果
    const testCase = result.testCases[0]; // 假设只有一个测试用例
    _this.stdout = testCase.message || ""; // 输出信息

    if (!_this.fileIOMode) {
      _this.stdout +=
        "\n\ntime: " +
        parseFloat(result.time)  +
        " ms\nmemory: " +
        result.memory / 1000 +
        " MB";
    } else {
      _this.cost =
        "\n\ntime: " +
        parseFloat(result.time)  +
        " ms\nmemory: " +
        result.memory / 1000 +
        " MB";
    }
  } else {
    // 处理错误结果
    console.log(result);

    // 根据状态更新 stdout
    _this.updateStdoutByStatus(result.status);

    //if (result.judgeTexts && result.judgeTexts.length > 0) {
      // 如果有编译错误信息
    //  _this.stdout += "\n" + result.judgeTexts.join("\n");
    //} else 
    if (result.compilerTexts && result.compilerTexts.length > 0) {
      // 如果有运行时错误信息
      _this.stdout += "\n" + result.compilerTexts.join("\n");
    } //else {
     // _this.stdout += "\n未知错误";
    //}
  }
},

updateStdoutByStatus(status) {
  switch (status) {
    case 0: // STATUS_WAITING
      this.stdout = "Waiting: 等待评测中...";
      break;
    case 1: // STATUS_ACCEPTED
      this.stdout = "Accepted: 程序运行成功，答案正确。";
      break;
    case 2: // STATUS_WRONG_ANSWER
      this.stdout = "Wrong Answer: 程序输出与预期不符。";
      break;
    case 3: // STATUS_TIME_LIMIT_EXCEEDED
      this.stdout = "Time Limit Exceeded: 程序运行超时。";
      break;
    case 4: // STATUS_MEMORY_LIMIT_EXCEEDED
      this.stdout = "Memory Limit Exceeded: 程序内存使用超出限制。";
      break;
    case 5: // STATUS_OUTPUT_LIMIT_EXCEEDED
      this.stdout = "Output Limit Exceeded: 程序输出超出限制。";
      break;
    case 6: // STATUS_RUNTIME_ERROR
      this.stdout = "Runtime Error: 程序运行时发生错误。";
      break;
    case 7: // STATUS_COMPILE_ERROR
      this.stdout = "Compile Error: 程序编译失败。";
      break;
    case 8: // STATUS_SYSTEM_ERROR
      this.stdout = "System Error: 系统内部错误。";
      break;
    case 9: // STATUS_CANCELED
      this.stdout = "Canceled: 评测已取消。";
      break;
    case 10: // STATUS_ETC
      this.stdout = "ETC: 其他错误。";
      break;
    case 11: // STATUS_HACKED
      this.stdout = "Hacked: 代码已被 Hack。";
      break;
    case 20: // STATUS_JUDGING
      this.stdout = "Judging: 正在评测中，请稍候...";
      break;
    case 21: // STATUS_COMPILING
      this.stdout = "Compiling: 正在编译中，请稍候...";
      break;
    case 22: // STATUS_FETCHED
      this.stdout = "Fetched: 评测结果已获取。";
      break;
    case 30: // STATUS_IGNORED
      this.stdout = "Ignored: 评测被忽略。";
      break;
    case 31: // STATUS_FORMAT_ERROR
      this.stdout = "Format Error: 输入格式错误。";
      break;
    case 32: // STATUS_HACK_SUCCESSFUL
      this.stdout = "Hack Successful: Hack 成功。";
      break;
    case 33: // STATUS_HACK_UNSUCCESSFUL
      this.stdout = "Hack Unsuccessful: Hack 失败。";
      break;
    default:
      this.stdout = "Unknown Status: 未知状态。";
      break;
  }
},
    
    
    
    
    
    
    
    
    getErr(r) {
      const arr = r.split("\n");
      this.decorations = [];
      arr.forEach((element, index) => {
        // 先验证main.cpp
        if (element.substr(0, 8) == "main.cpp") {
          // 判断第10位是否数字
          let str = element.substr(9, element.length);
          if (str[0] >= "0" && str[0] <= "9") {
            // 确定错误代码长度
            const tmp = arr[index + 2];
            const s = tmp.lastIndexOf("^") + 1;
            let _s = s;
            while (tmp[_s] == "~" && tmp[_s] != "\n") _s++;
            const len = _s - s + 1;
            // 到下个冒号之间为错误行号
            let row = str.substr(0, str.indexOf(":"));
            str = str.substr(str.indexOf(":") + 1, str.length);
            // 到下个冒号之间为错误列号
            let col = str.substr(0, str.indexOf(":"));
            // 最后一个冒号到换行为错误信息
            // const info = str.substr(str.indexOf(":") + 1, str.length).trim();
            let endCol = parseInt(col) + parseInt(len);
            if (
              endCol >
              this.editor.getModel().getLineContent(parseInt(row)).length
            )
              col = 0;
            const id = this.editor.getModel().deltaDecorations(
              // 添加错误行背景标记
              [],
              [
                {
                  range: new monaco.Range(
                    parseInt(row),
                    parseInt(col),
                    parseInt(row),
                    endCol
                  ),
                  options: {
                    // isWholeLine: true,
                    className:
                      this.theme == "vs"
                        ? "errorContentClassLight"
                        : "errorContentClassDark",
                  },
                },
              ]
            );
            this.decorations.push(id[0]);
          }
        }
      });
    },
    clearMarkers() {
      // 提交时清除所有错误
      const model = this.editor.getModel();
      model.deltaDecorations(this.decorations, []);
    },
    resize() {
      this.height = document.documentElement.clientHeight - this.barHeight;
      this.width = document.documentElement.clientWidth;
      this.$nextTick(() => {
        this.editor.layout();
        this.$refs.manoco_diff.getEditor().layout();
        this.$refs.manoco_diff.getModifiedEditor().layout();
        try {
          document.querySelector(".el-textarea__inner").style.height =
            this.height - this.barHeight - this.debug_output_height + "px";
          this.$refs.stdout.getEditor().layout();
        } catch (error) {}
      });
    },
    fileUpload(file) {
        function getfilesize(size) {
            var num = 1024.00; //byte
            if (size < num)
                return size + "B";
            if (size < Math.pow(num, 2))
                return (size / num).toFixed(2) + "KB"; //kb
            if (size < Math.pow(num, 3))
                return (size / Math.pow(num, 2)).toFixed(2) + "MB"; //M
            if (size < Math.pow(num, 4))
                return (size / Math.pow(num, 3)).toFixed(2) + "GB"; //G
            return (size / Math.pow(num, 4)).toFixed(2) + "TB"; //T
        }
        this.stdout = '';
        this.cost = '';
        let reader = new FileReader();
        reader.readAsText(file.raw, "UTF-8");
        reader.onload = e => {
            var content = e.target.result;
            this.stdinIOInfo.content = content;
            this.stdinIOInfo.name = file.name;
            this.stdinIOInfo.size = getfilesize(file.size);
        }
    }
  },
  watch: {
    theme(v) {
      this.clearMarkers();
      let stdin_el = document.querySelector(".el-textarea__inner");
      if (v != "vs") {
        stdin_el.style.background = "#1e1e1e";
        stdin_el.style.color = "white";
      } else {
        stdin_el.style.background = "#fffffe";
        stdin_el.style.color = "black";
      }
    },
    diff(v) {
      if (v) this.debug_width = 0;
      this.$nextTick(() => {
        this.editor.layout();
        this.$refs.manoco_diff.getEditor().layout();
        this.$refs.manoco_diff.getModifiedEditor().layout();
      });
    },
    fileIOMode(v) {
      if (!this.debug_width) this.debug_width = 400;
      this.stdout = '';
      this.cost = '';
    },
    diff() {
      this.code_ = this.code;
      this.resize();
    }
  },
};
</script>

<style>
.main {
  position: relative;
  width: 100%;
  height: 100%;
}
.dark {
  background: #1e1e1e;
  color: white;
}
.editor_div {
  overflow: hidden;
  border-right: 0.5px solid rgba(144, 147, 153, 0.3);
}
.debug {
  padding: 20px;
}
.el-textarea__inner {
  border: none !important;
  border-radius: 0 !important;
}
.bar {
  font-size: 10px;
}
.btn {
  font-size: 14px;
  cursor: pointer;
  transition: all 0.5s;
  border-radius: 3px;
}
.btn:hover {
  background: rgba(0, 0, 0, 0.205);
}
.items {
  width: 320px;
  position: relative;
  text-align: right;
}
.btn_settings {
  height: 28px;
  line-height: 28px;
  width: 50px;
  text-align: center;
  display: inline-block;
}
.format_tip_div {
  display: flex;
  align-items: center;
  width: 200px;
}
.format_tip {
  font-size: 13px;
  color: black;
  line-height: 32px;
  height: 32px;
  width: 250px;
  text-align: center;
}
.format_tip_dark {
  font-size: 13px;
  color: white;
  line-height: 32px;
  height: 32px;
  width: 250px;
  text-align: center;
}
.run {
  background: #67c23a;
  width: 60px;
  color: white;
  border: none;
}
.run:hover {
  background: #489223;
}
.settingsDialog {
  box-shadow: 0 3px 15px rgb(0 0 0 / 20%);
}
.el-header {
  padding: 0 !important;
}
.el-main {
  padding: 0 !important;
}
.resize_debug {
  cursor: move;
  position: absolute;
  color: rgba(155, 155, 155, 0.5);
  z-index: 999;
}
.stdout {
  font-size: 14px;
  padding: 10px;
  white-space: pre-wrap;
}
.area_tip {
  font-size: 14px;
  line-height: 24px;
  padding-left: 5px;
  border-bottom: 1px solid rgba(144, 147, 153, 0.2);
}

.errorContentClassLight {
  background: rgba(255, 0, 0, 0.35);
}
.errorContentClassDark {
  background: #8a202085;
}
/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
/* 滑轨 */
::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 1px rgba(99, 99, 99, 0.2);
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: rgba(206, 206, 206, 0.3);
}
::-webkit-scrollbar-thumb:window-inactive {
  background: rgba(144, 147, 153, 0.3);
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(119, 119, 119, 0.274);
}
</style>