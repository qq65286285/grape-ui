#!/bin/bash

# ===================================================================
# Vue项目自动部署脚本 - 交互式菜单版
# 功能: 检查状态 → 停止服务 → 更新代码 → 构建 → 启动服务
# 端口: 8309
# ===================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="grapeui"
PROJECT_PATH="/home/grape/grapeui"  # 根据实际路径调整
PORT=8309
BUILD_DIR="dist"
SERVE_PID_FILE="/tmp/grapeui_serve.pid"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示菜单
show_menu() {
    clear
    echo -e "${CYAN}======================================"
    echo -e "    Vue项目部署管理系统"
    echo -e "    项目: ${PROJECT_NAME}"
    echo -e "    端口: ${PORT}"
    echo -e "======================================${NC}"
    echo
    echo -e "${YELLOW}请选择操作:${NC}"
    echo -e "  ${GREEN}1.${NC} 完整部署 (停止 → 更新 → 构建 → 启动)"
    echo -e "  ${GREEN}2.${NC} 检查服务状态"
    echo -e "  ${GREEN}3.${NC} 重启服务 (停止 → 启动)"
    echo -e "  ${GREEN}4.${NC} 停止服务"
    echo -e "  ${GREEN}5.${NC} 启动服务"
    echo -e "  ${GREEN}6.${NC} 仅更新代码"
    echo -e "  ${GREEN}7.${NC} 查看服务日志"
    echo -e "  ${GREEN}0.${NC} 退出"
    echo
    echo -ne "${PURPLE}请输入选项 [0-7]: ${NC}"
}

# 按任意键继续
press_any_key() {
    echo
    echo -ne "${YELLOW}按任意键继续...${NC}"
    read -n 1
    echo
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 命令未找到，请先安装"
        exit 1
    fi
}

# 检查项目运行状态
check_status() {
    log_info "检查项目运行状态..."
    
    # 检查端口是否被占用
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        log_success "服务正在运行"
        log_info "进程ID: $PID"
        log_info "端口: $PORT"
        log_info "访问地址: http://localhost:$PORT"
        
        # 检查HTTP响应
        if command -v curl &> /dev/null; then
            if curl -f -s http://localhost:$PORT >/dev/null 2>&1; then
                log_success "HTTP服务响应正常"
            else
                log_warning "HTTP服务响应异常"
            fi
        fi
        return 0
    else
        log_warning "服务未运行 (端口 $PORT 未被占用)"
        return 1
    fi
}

# 停止服务
stop_service() {
    log_info "正在停止服务..."
    
    # 通过端口查找并停止进程
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        log_info "找到进程 $PID，正在停止..."
        kill -TERM $PID
        sleep 3
        
        # 如果还在运行，强制杀死
        if kill -0 $PID 2>/dev/null; then
            log_warning "进程仍在运行，强制停止..."
            kill -KILL $PID
            sleep 2
        fi
        
        log_success "服务已停止"
    else
        log_info "服务未在运行"
    fi
    
    # 清理PID文件
    if [[ -f $SERVE_PID_FILE ]]; then
        rm -f $SERVE_PID_FILE
    fi
}

# 更新代码
update_code() {
    log_info "正在更新代码..."
    
    if [[ ! -d "$PROJECT_PATH/.git" ]]; then
        log_error "项目目录不是Git仓库: $PROJECT_PATH"
        return 1
    fi
    
    cd $PROJECT_PATH
    
    # 显示当前分支和版本
    CURRENT_BRANCH=$(git branch --show-current)
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    log_info "当前分支: $CURRENT_BRANCH"
    log_info "当前提交: $CURRENT_COMMIT"
    
    # 检查工作区状态
    if ! git diff-index --quiet HEAD --; then
        log_warning "工作区有未提交的修改"
        echo -ne "${YELLOW}是否要暂存修改并继续? [y/N]: ${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            git stash
            log_info "修改已暂存"
        else
            log_error "请先提交或暂存修改"
            return 1
        fi
    fi
    
    # 拉取最新代码
    log_info "拉取最新代码..."
    if git pull origin $CURRENT_BRANCH; then
        NEW_COMMIT=$(git rev-parse --short HEAD)
        if [[ "$CURRENT_COMMIT" != "$NEW_COMMIT" ]]; then
            log_success "代码已更新到: $NEW_COMMIT"
            echo -e "${CYAN}更新日志:${NC}"
            git log --oneline --graph -5
        else
            log_success "代码已是最新版本"
        fi
    else
        log_error "代码更新失败"
        return 1
    fi
}

# 安装依赖
install_dependencies() {
    log_info "检查并安装依赖..."
    
    cd $PROJECT_PATH
    
    if [[ -f "package-lock.json" ]]; then
        log_info "使用 npm ci 安装依赖..."
        npm ci
    elif [[ -f "yarn.lock" ]]; then
        log_info "使用 yarn 安装依赖..."
        yarn install --frozen-lockfile
    else
        log_info "使用 npm install 安装依赖..."
        npm install
    fi
    
    log_success "依赖安装完成"
}

# 构建项目
build_project() {
    log_info "正在构建项目..."
    
    cd $PROJECT_PATH
    
    # 清理之前的构建
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf $BUILD_DIR
        log_info "清理旧的构建文件"
    fi
    
    # 构建项目
    if [[ -f "package.json" ]]; then
        log_info "开始执行构建..."
        if npm run build; then
            log_success "项目构建成功"
        else
            log_error "项目构建失败"
            return 1
        fi
    else
        log_error "未找到 package.json 文件"
        return 1
    fi
    
    # 检查构建结果
    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "构建目录 $BUILD_DIR 不存在"
        return 1
    fi
    
    # 显示构建信息
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    log_info "构建大小: $BUILD_SIZE"
}

# 启动服务
start_service() {
    log_info "正在启动服务..."
    
    cd $PROJECT_PATH
    
    # 检查构建目录
    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "构建目录 $BUILD_DIR 不存在，请先构建项目"
        return 1
    fi
    
    # 检查是否安装了serve
    if ! command -v serve &> /dev/null; then
        log_info "安装 serve..."
        npm install -g serve
    fi
    
    # 启动服务
    log_info "在端口 $PORT 启动服务..."
    nohup serve -s $BUILD_DIR -l $PORT > /tmp/grapeui_serve.log 2>&1 &
    SERVE_PID=$!
    echo $SERVE_PID > $SERVE_PID_FILE
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 3
    
    # 检查服务是否启动成功
    if kill -0 $SERVE_PID 2>/dev/null; then
        log_success "服务启动成功!"
        log_success "访问地址: http://localhost:$PORT"
        log_success "进程ID: $SERVE_PID"
        log_info "日志文件: /tmp/grapeui_serve.log"
        
        # 尝试打开浏览器
        if command -v xdg-open &> /dev/null; then
            echo -ne "${YELLOW}是否要打开浏览器? [y/N]: ${NC}"
            read -r -n 1 response
            echo
            if [[ "$response" =~ ^[Yy]$ ]]; then
                xdg-open "http://localhost:$PORT" 2>/dev/null &
            fi
        fi
    else
        log_error "服务启动失败"
        echo -e "${RED}错误日志:${NC}"
        cat /tmp/grapeui_serve.log
        return 1
    fi
}

# 查看日志
show_logs() {
    log_info "显示服务日志..."
    
    if [[ -f "/tmp/grapeui_serve.log" ]]; then
        echo -e "${CYAN}=== 服务日志 (最后20行) ===${NC}"
        tail -20 /tmp/grapeui_serve.log
        echo
        echo -ne "${YELLOW}是否要实时查看日志? [y/N]: ${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo -e "${CYAN}按 Ctrl+C 退出日志查看${NC}"
            tail -f /tmp/grapeui_serve.log
        fi
    else
        log_warning "日志文件不存在"
    fi
}

# 完整部署
full_deploy() {
    log_info "开始完整部署流程..."
    echo "======================================"
    
    # 检查必要的命令和目录
    check_command "git"
    check_command "node"
    check_command "npm"
    check_command "lsof"
    
    if [[ ! -d "$PROJECT_PATH" ]]; then
        log_error "项目目录不存在: $PROJECT_PATH"
        return 1
    fi
    
    # 执行部署流程
    echo -e "${CYAN}步骤 1/5: 检查并停止现有服务${NC}"
    check_status && stop_service
    
    echo -e "${CYAN}步骤 2/5: 更新代码${NC}"
    update_code || return 1
    
    echo -e "${CYAN}步骤 3/5: 安装依赖${NC}"
    install_dependencies || return 1
    
    echo -e "${CYAN}步骤 4/5: 构建项目${NC}"
    build_project || return 1
    
    echo -e "${CYAN}步骤 5/5: 启动服务${NC}"
    start_service || return 1
    
    echo "======================================"
    log_success "完整部署完成!"
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    echo "======================================"
    
    echo -e "${CYAN}步骤 1/2: 停止服务${NC}"
    stop_service
    
    echo -e "${CYAN}步骤 2/2: 启动服务${NC}"
    start_service
    
    echo "======================================"
    if [[ $? -eq 0 ]]; then
        log_success "服务重启完成!"
    else
        log_error "服务重启失败!"
    fi
}

# 主循环
main() {
    while true; do
        show_menu
        read -r choice
        echo
        
        case $choice in
            1)
                echo -e "${PURPLE}=== 执行完整部署 ===${NC}"
                full_deploy
                press_any_key
                ;;
            2)
                echo -e "${PURPLE}=== 检查服务状态 ===${NC}"
                check_status
                press_any_key
                ;;
            3)
                echo -e "${PURPLE}=== 重启服务 ===${NC}"
                restart_service
                press_any_key
                ;;
            4)
                echo -e "${PURPLE}=== 停止服务 ===${NC}"
                stop_service
                press_any_key
                ;;
            5)
                echo -e "${PURPLE}=== 启动服务 ===${NC}"
                start_service
                press_any_key
                ;;
            6)
                echo -e "${PURPLE}=== 更新代码 ===${NC}"
                update_code
                press_any_key
                ;;
            7)
                echo -e "${PURPLE}=== 查看日志 ===${NC}"
                show_logs
                press_any_key
                ;;
            0)
                echo -e "${GREEN}再见!${NC}"
                exit 0
                ;;
            *)
                log_error "无效选项: $choice"
                sleep 2
                ;;
        esac
    done
}

# 启动主程序
main

