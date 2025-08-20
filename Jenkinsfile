pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20'
        DOCKER_IMAGE = 'allertify-be'
        DOCKER_TAG = "${BUILD_NUMBER}"

         // Environment variables for production
        DATABASE_URL = 'postgresql://allertify:12345678@localhost:5437/allertify'
        JWT_ACCESS_SECRET = '4lL3rT1FFy_BE_ACC'
        JWT_REFRESH_SECRET = '4lL3rT1FFy_BE_RFR'
        CLOUDINARY_CLOUD_NAME = 'dvlsclorg'
        CLOUDINARY_API_KEY = '726327219123868'
        CLOUDINARY_API_SECRET = 'UF0HD89O-4IhQY2_NWE0qBjDfCc'
        SMTP_USER = 'arvanyudhistiaardana@gmail.com'
        SMTP_PASS = 'mglckoproodsaief'
        SMTP_FROM = 'arvanyudhistiaardana@gmail.com'
        GEMINI_API_KEY = 'AIzaSyBKPkySOCvHasm2MlFi0Njp36RNmwIZ2XI'
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

        stage('Generate Environment File') {
            steps {
                script {
                    // Generate .env dari Jenkins credentials
                    sh '''
                        echo "# Database Configuration" > .env
                        echo "DATABASE_URL=${DATABASE_URL}" >> .env
                        echo "" >> .env
                        echo "# JWT Configuration" >> .env
                        echo "JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}" >> .env
                        echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}" >> .env
                        echo "" >> .env
                        echo "# Cloudinary Configuration" >> .env
                        echo "CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}" >> .env
                        echo "CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}" >> .env
                        echo "CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}" >> .env
                        echo "" >> .env
                        echo "# Email Configuration" >> .env
                        echo "SMTP_USER=${SMTP_USER}" >> .env
                        echo "SMTP_PASS=${SMTP_PASS}" >> .env
                        echo "SMTP_FROM=${SMTP_FROM}" >> .env
                        echo "" >> .env
                        echo "# AI Configuration" >> .env
                        echo "GEMINI_API_KEY=${GEMINI_API_KEY}" >> .env
                        echo "" >> .env
                        echo "# Server Configuration" >> .env
                        echo "NODE_ENV=production" >> .env
                        echo "PORT=3001" >> .env
                        echo "BYPASS_AUTH=false" >> .env
                        echo "BYPASS_AI=false" >> .env
                        echo "DEFAULT_TIMEZONE=Asia/Jakarta" >> .env
                        echo "" >> .env
                        echo "# Hardcoded Data" >> .env
                        echo "HARDCODED_USER_ID=1" >> .env
                        echo "HARDCODED_USER_EMAIL=test@example.com" >> .env
                        echo "HARDCODED_USER_ROLE=user" >> .env
                        echo "HARDCODED_ALLERGENS=gluten,lactose,nuts,shellfish,eggs" >> .env
                    '''
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
                    string(credentialsId: 'vps-host', variable: 'VPS_HOST')
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
                        rsync -av -e "ssh -o StrictHostKeyChecking=no -i ${SSH_KEY}" ./ "${SSH_USER}@${VPS_HOST}:~/allertify-be/"
                        
                        echo "🔧 Setting .env file permissions..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "chmod 644 ~/allertify-be/.env"

                        echo "📦 Installing dependencies di VPS..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "cd ~/allertify-be && npm ci"
                        
                        echo "🔧 Generating Prisma client di VPS..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "cd ~/allertify-be && npx prisma generate"
                        
                        echo "🏗️ Building application di VPS..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "cd ~/allertify-be && npm run build"
                        
                        echo "🚀 Menjalankan docker compose di VPS..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "cd ~/allertify-be && docker compose --env-file .env up -d --build"
                        
                        echo "📋 Copying Prisma client dari container ke host..."
                        ssh -o StrictHostKeyChecking=no -i "${SSH_KEY}" "${SSH_USER}@${VPS_HOST}" "cd ~/allertify-be && docker cp allertify-be:/app/node_modules/.prisma ./node_modules/ && docker cp allertify-be:/app/node_modules/@prisma ./node_modules/"

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