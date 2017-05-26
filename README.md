# Build API and SDK

## Overview

![Overview](/ci-2.png)

## Build SDK

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

## List SVN Dirs

Interface:

    "http://172.27.142.7:8070" + jenkinsLib.projectSVN

Example:

http://172.27.142.7:8070/yy-music/src/server/trunk/

## Check Sub Dir has [Mm]akefile or pom.xml

Interface:

    "http://172.27.142.7:8070" + jenkinsLib.projectSVN + jenkinsLib.projectDir + "/Makefile"
    
Example:

 http://172.27.142.7:8070/yy-music/src/server/trunk/music_videoSnapshot_d/Makefile
 
 