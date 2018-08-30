def checkoutBranch(folderName, url, branchName) {
  dir(folderName) {
    deleteDir()
    checkout([
      $class: 'GitSCM',
      branches: [[name: branchName]],
      doGenerateSubmoduleConfigurations: false,
      extensions: [],
      gitTool: 'Default',
      submoduleCfg: [],
      userRemoteConfigs: [[url: url]]
    ])
  }
}

node ('linux') {
  def artifactoryServer = Artifactory.server 'prod'
  def mavenRuntime = Artifactory.newMavenBuild()
  mavenRuntime.tool = 'm3' 
  mavenRuntime.deployer releaseRepo: 'libs-release-local', snapshotRepo: 'libs-snapshot-local', server: artifactoryServer
  mavenRuntime.resolver releaseRepo: 'repo', snapshotRepo: 'repo', server: artifactoryServer
  mavenRuntime.deployer.deployArtifacts = false
  def buildInfo = Artifactory.newBuildInfo()

  stage ('SCM globals') {
     sh '''
git config --global user.email "paul.austin@revolsys.com"
git config --global user.name "Paul Austin"
     '''
  }

  stage ('Checkout') {
    dir ('source') {
      deleteDir()
    }
    checkoutBranch('source', 'ssh://git@github.com/revolsys/com.revolsys.gdal.gdal-jni.git', 'master');
  }
  
  stage ('Cross Platform') {
    dir ('source') {
      sh '''
npm install
gulp download
gulp patch
      '''
    }
  }
  
  stage ('Native Library Build') {

    stash includes: 'source/**', excludes: 'source/node_modules', name: 'source';

    node ('macosx') {

      env.NODEJS_HOME = "${tool 'node-latest'}"
      env.PATH="${env.NODEJS_HOME}/bin:${env.PATH}"
      unstash 'source';
      dir ('source') {
        sh '''
npm install
gulp configure
gulp make
gulp swigOSX
      '''
      }
      stash includes: 'source/gdal-src/swig/java/libgdalalljni.dylib', name: 'osxLib';
    }
    unstash 'osxLib'
 
 /*   node ('windows') {
      dir ('source') {
        deleteDir()
      }

      env.PATH = env.PATH + ";c:\\Windows\\System32"
      unstash 'shared';
      unstash 'windows';
      dir ('source') {
        bat 'build-winnt.bat'
      }
      stash includes: '''
        source/target/classes/natives/windows_64/*.dll
      ''', name: 'windowsLib';
    }
    unstash 'windowsLib'*/

    dir ('source') {
      sh '''
gulp configure
gulp make
gulp swig
gulp copyJava
      '''
    }
  
    stage('build') {
      dir ('source') {
        mavenRuntime.run pom: 'pom.xml', goals: 'install', buildInfo: buildInfo
      }
    }
    
    stage('deploy') {
      dir ('source') {
        mavenRuntime.deployer.deployArtifacts buildInfo
        artifactoryServer.publishBuildInfo buildInfo
      }
    }
  }
}
