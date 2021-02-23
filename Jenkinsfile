pipeline {
    agent any
    environment {
        REMOTE_HOST = "${params.RemoteHost}"
        REMOTE_STAGE_DIR = "${params.RemoteStageDir}"
        REMOTE_PROD_DIR = "${params.RemoteProdDir}"
        REMOTE_STAGE_URL = "${params.RemoteStageUrl}"
        REMOTE_PROD_URL = "${params.RemoteProdUrl}"
    }
    stages {
        stage('staging') {
            steps {
                sh 'make clean'
                sh 'make build'
                sh 'rsync -rz ./dist $REMOTE_HOST:$REMOTE_STAGE_DIR'
                sh 'curl --silent --output /dev/null --show-error --fail $REMOTE_STAGE_URL'
            }
        }
        stage('prod') {
            steps {
                sh 'make clean'
                sh 'make build'
                sh 'rsync -rz ./dist $REMOTE_HOST:$REMOTE_PROD_DIR'
                sh 'curl --silent --output /dev/null --show-error --fail $REMOTE_PROD_URL'
            }
        }
    }
}
