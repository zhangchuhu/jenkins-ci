var jenkinsURL = 'http://172.27.142.7:8080'

var jenkinsAuth = {
  username: 'xxxxxx',  // Need apply
  password: 'xxxxxx'
}

var jenkinsGet = {
  baseURL: jenkinsURL,
  auth: jenkinsAuth
}

var jenkinsPost = {
  baseURL: jenkinsURL,
  auth: jenkinsAuth,
  headers: {
    'Content-Type': 'application/xml'
  },
}

var jenkinsPostForm = {
  baseURL: jenkinsURL,
  auth: jenkinsAuth,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
}

var jenkinsLib = {
  projectTemplate: 'template-cpp-music',
  projectSVN: '/yy-music/src/server/trunk/',
  projectDir: '',
  projectImage: '',

  _log: function(message) {
    console.log('Call_Jenkins: ' + message)
  },
  _error: function(error) {
    this._log('Requesting to jenkins got an error: ' + error)
    console.log([error.response, error.request, error.message, error.config, error].join('; '))
  },
  buildProject: function() {
    var self = this
    self._log('Requesting to jenkins...')
    self._mkJobDir(self.projectSVN)
  },
  _buildProject: function() {
    var self = this
    var jobURL = (self.projectSVN + self.projectDir).split('/').join('/job/')
    self._log('Check if the job exists: ' + jobURL)
    axios.get(jobURL + '/config.xml', jenkinsGet)
      .then(function(response) {
        self._log('The job already exists. Building...')
        self._updateAndBuildJob()
      })
      .catch(function(error) {
        if (error.response && error.response.status === 404) {
          self._log('The job does not exists. Creating new...')
          self._createAndBuildJob()
        } else {
          self._error(error)
        }
      })
  },
  _mkJobDir: function(path) {
    var self = this
    var folders = path.split('/').filter(function(s) {
      return s.length !== 0
    })
    if (folders.length > 0) {
      self.__mkJobDir([folders.shift()], folders)
    }
  },
  __mkJobDir: function(folders, continuation) {
    var self = this
    console.log('__mkJobDir: folders = ' + folders + ', continuation = ' + continuation)
    if (folders.length > 0) {
      // @see https://gist.github.com/stuart-warren/7786892 for create folder
      var parent = [''].concat(folders.slice(0, -1)).join('/job/')
      axios.post(jenkinsURL + parent + '/createItem?name=' + folders[folders.length - 1] + '&mode=com.cloudbees.hudson.plugins.folder.Folder&from=&json=%7B%22name%22%3A%22FolderName%22%2C%22mode%22%3A%22com.cloudbees.hudson.plugins.folder.Folder%22%2C%22from%22%3A%22%22%2C%22Submit%22%3A%22OK%22%7D&Submit=OK', '', jenkinsPostForm)
        .then(function(response) {
          self._log('Folder created: ' + folders)
        })
        .catch(function(error) {
          if (error.response) {
            if (error.response.status === 302)
              self._log('Folder created: ' + folders)
            else if (error.response.status === 400)
              self._log('Folder exist: ' + folders)
            else
              throw error
          } else {
            throw error
          }
        })
        .then(function() {
          if (continuation.length > 0) {
            folders.push(continuation.shift())
            self.__mkJobDir(folders, continuation)
          } else {
            self._buildProject()
          }
        })
        .catch(function(error) {
          self._error(error)
        })
    }
  },
  _createAndBuildJob: function(options) {
    var self = this
    if (options === undefined) options = {};
    var templateURL = '/job/' + self.projectTemplate + '/config.xml'
    self._log('Getting project template: ' + templateURL)
    axios.get(templateURL, jenkinsGet)
      .then(function(response) {
        var template = response.data
        if (options.update) {
          var jobURL = (self.projectSVN + self.projectDir).split('/').join('/job/')
          self._log('Update existing job at: ' + jobURL)
          return axios.post(jobURL + '/config.xml', template, jenkinsPost)
        } else {
          var createURL = self.projectSVN.split('/').slice(0, -1).join('/job/') + '/createItem?name=' + self.projectDir
          self._log('Create new job at: ' + createURL)
          return axios.post(createURL, template, jenkinsPost)
        }
      })
      .then(function(response) {
        self._log('Job ' + (options.update ? 'updated' : 'created') + '. Building...')
        self._buildJob()
      })
      .catch(function(error) {
        self._error(error)
      })
  },
  _updateAndBuildJob: function() {
    this._createAndBuildJob({
      update: true
    })
  },
  _buildJob: function() {
    var self = this
    var jobURL = (self.projectSVN + self.projectDir).split('/').join('/job/')
    var buildNumber
    self._log('Build ' + jobURL)
    axios.get(jobURL + '/api/json', jenkinsGet)
      .then(function(response) {
        buildNumber = response.data.nextBuildNumber
        self._log('Build #' + buildNumber)
        var params = new URLSearchParams()
        params.append('BUILD_TEMPLATE', self.projectTemplate)
        params.append('IMAGE_NAME', self.projectImage)
        return axios.post(jobURL + '/buildWithParameters', params, jenkinsPostForm)
      })
      .then(function(response) {
        var buildURL = jobURL + '/' + buildNumber
        self._checkJob(buildURL)
      })
      .catch(function(error) {
        self._error(error)
      })
  },
  _checkJob: function(buildURL) {
    var self = this
    window.setTimeout(function() {
      axios.get(buildURL + '/api/json?depth=1', jenkinsGet)
        .then(function(response) {
          if (response.data.building) {
            var progress = response.data.executor.progress
            if (progress < 0)
              progress = ''
            else if (progress > 100)
              progress = '100%'
            else
              progress = progress + '%'
            self._log('Building... ' + progress)
            self._checkJob(buildURL)
          } else {
            self._doneJob(buildURL)
          }
        })
        .catch(function(error) {
          if (error.response && error.response.status === 404) {
            self._log('Scheduling...')
            self._checkJob(buildURL)
          } else {
            self._error(error)
          }
        })
    }, 5000)
  },
  _doneJob: function(buildURL) {
    var self = this
    axios.get(buildURL + '/api/json', jenkinsGet)
      .then(function(response) {
        self._log('Done. Result ' + response.data.result + ', Cost ' + response.data.duration + ' ms')
      })
      .catch(function(error) {
        self._error(error)
      })
  }
}

jenkinsLib.projectTemplate = 'template-cpp-music'      // Template for yy-music C++ projects. Every biz has its own template.
jenkinsLib.projectSVN = '/yy-music/src/server/trunk/'  // Must start with '/' and must end with '/'
jenkinsLib.projectDir = 'music_attentionList_d'        // The direct sub-dir of above path
jenkinsLib.projectImage = 'music_attentionlist_m'      // Docker image name

//jenkinsLib.buildProject()                              // Start build
