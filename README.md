# Build API and SDK

## Overview

![Overview](/ci-2.png)

## 构建 SDK

Example: `build.html`

```html
<script src="https://unpkg.com/axios@0.16.1/dist/axios.min.js"></script>
<script src="http://code.yy.com/huanghao/jenkins-ci/raw/master/sdk/CallJenkins.js"></script>
<script>
    jenkinsLib.projectTemplate = 'template-cpp-music'      // Template for yy-music C++ projects. Every biz has its own template.
    jenkinsLib.projectSVN = '/yy-music/src/server/trunk/'  // Must start with '/' and must end with '/'
    jenkinsLib.projectDir = 'music_attentionList_d'        // The direct sub-dir of above path
    jenkinsLib.projectImage = 'music_attentionlist_m'      // Docker image name
    jenkinsLib.buildProject()                              // Start build
</script>
```

### 构建参数

*   `projectTemplate` 项目模板表示一套预定义的构建环境。目前的模板有：

    -   娱乐后台C++项目 (ubuntu12.04 g++32bits)

*   `projectSVN + projectDir` 以 `/` 开头的 SVN 路径。例如：
    
    -   主干路径 `/yy-music/src/server/trunk/music_attentionList_d` 或者
    -   分支路径 `/yy-music/src/server_baselib/branches/release_2/nraq_antichat_d`

## 验证 SVN 路径 

### 检查 `projectSVN` 是否合法

1. 必须以 `/` 开头 ，必须以 `/` 结尾
2. 必须包含 `/trunk/`（是主干）
3. 或者，包含 `/branches/XXXXXX/` （是分支。XXXXXX为分支名）

### 列出所有的 `projectDir`

Interface:

    "http://172.27.142.7:8070" + jenkinsLib.projectSVN

Example:

http://172.27.142.7:8070/yy-music/src/server/trunk/

### 检查 `projectDir` 是否合法，看下面是否有 `[Mm]akefile`

Interface:

    "http://172.27.142.7:8070" + jenkinsLib.projectSVN + jenkinsLib.projectDir + "/Makefile"
    
Example:

 http://172.27.142.7:8070/yy-music/src/server/trunk/music_videoSnapshot_d/Makefile
 
## 显示构建进度，获知构建成功失败

在调用 `jenkinsLib.buildProject()` 之前注册回调事件

```js
jenkinsLib.onProgress = function(job, phase, progress, result) {
    // job: string - URL of this job
    // phase: string - Scheduling, Building, Done
    // progress: number - [0, 100]
    // result: string - undefined, SUCCESS, FAILURE
  }
```
