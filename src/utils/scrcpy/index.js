/*
 * Scrcpy 客户端（来自 screen-tools，已验证可用）
 */
import JMuxer from 'jmuxer';

class Scrcpy {
  // 构造
  constructor(props) {
    const {
      excuteMode, // 运行模式
    } = props;
    this.props = props;
    this.excuteMode = excuteMode;
    // JMuxer初始化
    this.initial(props);
    // websocket初始化
    this.websocketInit(props);
    // 监听页面激活状态
    this.onPageFocus();
  }

  cmdFN(cmd) {
    if (cmd.msg == 'size') {
      console.log(`[Scrcpy] 屏幕尺寸: ${cmd.width} x ${cmd.height}`);
      this.isInit = true;
    }
  }

  initial(props) {
    // 初始化播放器
    if (!this.jmuxer && this.excuteMode == 'Scrcpy') {
      const {
        node, // video dom节点
      } = props;
      console.log('[Scrcpy] 初始化 JMuxer，节点:', node);
      this.jmuxer = new JMuxer({
        node: node || 'player',
        mode: 'video',
        flushingTime: 0,
        fps: 60,
        debug: false,
      });
      console.log('[Scrcpy] JMuxer 初始化完成');
    }
  }

  websocketInit(props) {
    if (!this.websocket) {
      const { socketURL, onmessage, onopen, onclose } = props;
      console.log('[Scrcpy] 初始化 WebSocket:', socketURL);
      this.websocket = new WebSocket(socketURL);
      this.websocket.binaryType = 'arraybuffer';

      this.websocket.addEventListener('message', (event) => {
        if (typeof event.data === 'string') {
          console.log('[Scrcpy] 收到消息:', event.data);
          this.cmdFN(JSON.parse(event.data));
          onmessage && onmessage(event);
        } else if (
          typeof event.data === 'object' &&
          this.excuteMode == 'Scrcpy'
        ) {
          // 接收视频帧
          this.jmuxer.feed({
            video: new Uint8Array(event.data),
          });
        } else {
          onmessage && onmessage(event);
        }
      });

      this.websocket.addEventListener('error', (e) => {
        console.error('[Scrcpy] WebSocket 错误', e);
        const { onclose: closeHandler } = props;
        closeHandler && closeHandler(e);
      });

      this.websocket.addEventListener('open', (e) => {
        console.log('[Scrcpy] WebSocket 已连接');
        // 发送 switch 消息启动投屏
        this.websocket.send(
          JSON.stringify({
            type: 'switch',
            detail: this.excuteMode.toLowerCase(),
          })
        );
        console.log('[Scrcpy] 已发送启动命令');
        onopen && onopen(e);
      });

      this.websocket.addEventListener('close', (e) => {
        console.log('[Scrcpy] WebSocket 已关闭');
        onclose && onclose(e);
      });
    }
  }

  switchMode = (mode) => {
    console.log('[Scrcpy] 切换模式:', mode);
    this.excuteMode = mode;
    this.destroy();
    this.initial(this.props);
    this.websocket.send(
      JSON.stringify({
        type: 'switch',
        detail: this.excuteMode.toLowerCase(),
      })
    );
    if (mode !== 'Scrcpy') {
      // 重置播放器
      this.jmuxer && this.jmuxer.reset();
    }
  };

  destroy() {
    this.jmuxer && this.jmuxer.destroy();
    // 释放内存
    this.jmuxer = null;
    window.onfocus = null;
  }

  close() {
    this.destroy();
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  onPageFocus() {
    const videoDom = document.getElementById(this.props?.node || 'player');
    if (videoDom) {
      window.onfocus = function () {
        // 将当前播放进度更新至当前最新缓冲时间
        try {
          if (videoDom.buffered.length > 0) {
            videoDom.currentTime = Math.ceil(videoDom.buffered.end(0));
          }
        } catch (e) {
          console.error('更新播放进度失败', e);
        }
      };
    }
  }
}

export default Scrcpy;
