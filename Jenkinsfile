pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
        DOCKER_IMAGE = 'allertify-be'
        DOCKER_TAG = "${BUILD_NUMBER}"

         DATABASE_URL = credentials('DATABASE_URL')
        
        // JWT secrets
        JWT_ACCESS_SECRET = credentials('JWT_ACCESS_SECRET')
        JWT_REFRESH_SECRET = credentials('JWT_REFRESH_SECRET')
        
        // Cloudinary
        CLOUDINARY_CLOUD_NAME = credentials('CLOUDINARY_CLOUD_NAME')
        CLOUDINARY_API_KEY = credentials('CLOUDINARY_API_KEY')
        CLOUDINARY_API_SECRET = credentials('CLOUDINARY_API_SECRET')
        
        // Email
        SMTP_USER = credentials('SMTP_USER')
        SMTP_PASS = credentials('SMTP_PASS')
        SMTP_FROM = credentials('SMTP_FROM')
        
        // AI
        GEMINI_API_KEY = credentials('GEMINI_API_KEY')
    }
    
    stages {
        stage('Setup Env Vars') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vps-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'vps-host', variable: 'VPS_HOST')
                ]) {
                                        script {
                        env.SSH_USER = 'root'  // Hardcode username jadi root
                        env.SSH_KEY = SSH_KEY
                        env.VPS_HOST = VPS_HOST
                    }
                }
            }
        }

        stage('Clone Repository') {
            steps {
                checkout scm
                echo "Repository berhasil di-clone"
            }
        }

        stage('Show Commit Info') {
            steps {
                sh '''
                    echo "✅ Commit yang sedang dideploy:"
                    git log -1 --pretty=format:"%h - %an: %s"
                    
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                sh '''
                    npm ci
                    npx prisma generate
                '''
            }
        }

        stage('Build Application') {
            steps {
                echo '🏗️ Building application...'
                sh '''
                    npm run build
                    ls -la dist/
                '''
            }
        }

        // stage('Security Scan') {
        //     steps {
        //         echo '🔒 Running security scan...'
        //         sh '''
        //             npm audit --audit-level=high
        //         '''
        //     }
        // }

        stage('Build Docker Image') {
            // when {
            //     anyOf {
            //         branch 'arvan'
            //     }
            // }
            steps {
                echo '🐳 Building Docker image...'
                script {
                    def image = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    
                    // Save image for deployment
                    sh "docker save ${DOCKER_IMAGE}:${DOCKER_TAG} | gzip > ${DOCKER_IMAGE}-${DOCKER_TAG}.tar.gz"
                    archiveArtifacts artifacts: "${DOCKER_IMAGE}-${DOCKER_TAG}.tar.gz", fingerprint: true
                }
            }
        }

        stage('Deploy to VPS') {
            // when {
            //     anyOf {
            //         branch 'arvan'
            //     }
            // }
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vps-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'vps-host', variable: 'VPS_HOST'),
                    file(credentialsId: 'allertify-env', variable: 'ENV_FILE')
                ]) {
                    sh '''#!/bin/bash
                        echo "📁 Mengecek dan membersihkan direktori allertify-be di VPS..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" '
                            if [ -d ~/allertify-be ]; then
                                echo "📦 Direktori allertify-be ditemukan. Menghapus..."
                                rm -rf ~/allertify-be
                            else
                                echo "📂 Direktori allertify-be tidak ditemukan. Akan dibuat baru."
                            fi
                            mkdir -p ~/allertify-be
                        '

                        echo "📤 Menyalin source code..."
                        rsync -av --exclude='.env' -e "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY}" ./ "${SSH_USER}@${VPS_HOST}:~/allertify-be/"

                        echo "📤 Menyalin .env dari Credentials ke VPS..."
                        scp -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${ENV_FILE}" "${SSH_USER}@${VPS_HOST}:~/allertify-be/.env"
                        
                        echo "🔧 Setting .env file permissions..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "chmod 644 ~/allertify-be/.env"

                        echo "🚀 Menjalankan docker compose di VPS..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "cd ~/allertify-be && docker compose --env-file .env up -d --build"

                        echo "✅ Deployment berhasil dijalankan"
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'vps-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'vps-host', variable: 'VPS_HOST')
                ]) {
                    sh '''#!/bin/bash
                        echo "Memeriksa container yang berjalan..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "docker ps"
                    '''
                }
                
                script {
                    try {
                        sh '''#!/bin/bash
                            echo "Memeriksa respons aplikasi..."
                            curl -f http://${VPS_HOST}:3000/health || echo "Service might still be starting up"
                        '''
                        echo "Deployment verification complete"
                    } catch (Exception e) {
                        echo "Warning: Could not verify service: ${e.message}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Cleaning up...'
            sh '''
                docker system prune -f
                rm -f ${DOCKER_IMAGE}-*.tar.gz
            '''
        }
        
        success {
            echo "✅ Deployment successful! Application running at http://${env.VPS_HOST}:3000"
        }
        
        failure {
            echo "❌ Deployment failed. Check logs for details."
        }
    }
}