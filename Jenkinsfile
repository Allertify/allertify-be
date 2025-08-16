pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_IMAGE = 'allertify-backend'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                echo "Setting up Node.js ${NODE_VERSION}..."
                sh '''
                    # Install Node.js using nvm if available, or use system node
                    node --version
                    npm --version
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh '''
                    npm ci
                    npx prisma generate
                '''
            }
        }
        
        stage('Lint & Format Check') {
            steps {
                echo 'Running linter and format checks...'
                sh '''
                    npm run lint
                    # Add format check if needed
                    # npm run format:check
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                sh '''
                    # Run unit tests
                    npm test
                    
                    # Run integration tests if database is available
                    # npm run test:integration
                '''
                
                // Publish test results
                publishTestResults testResultsPattern: 'test-results.xml'
            }
        }
        
        stage('Build Application') {
            steps {
                echo 'Building application...'
                sh '''
                    npm run build
                '''
            }
        }
        
        stage('Security Scan') {
            steps {
                echo 'Running security scan...'
                sh '''
                    # Run npm audit
                    npm audit --audit-level=high
                    
                    # Add other security tools if needed
                    # npm install -g snyk
                    # snyk test
                '''
            }
        }
        
        stage('Build Docker Image') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                echo 'Building Docker image...'
                script {
                    def image = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.withRegistry('', 'docker-hub-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to staging environment...'
                sh '''
                    # Add deployment commands here
                    # kubectl apply -f k8s/staging/
                    # or docker-compose up -d
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to production environment...'
                input message: 'Deploy to production?', ok: 'Deploy'
                sh '''
                    # Add production deployment commands here
                    # kubectl apply -f k8s/production/
                '''
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            sh '''
                # Clean up test databases, temporary files, etc.
                docker system prune -f
            '''
        }
        
        success {
            echo 'Pipeline completed successfully!'
            // Send success notification
            // slackSend channel: '#deployments', message: "✅ Build ${BUILD_NUMBER} succeeded"
        }
        
        failure {
            echo 'Pipeline failed!'
            // Send failure notification
            // slackSend channel: '#deployments', message: "❌ Build ${BUILD_NUMBER} failed"
        }
    }
}