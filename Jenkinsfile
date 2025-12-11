
pipeline {
    agent any

    tools {
        nodejs 'nodejs'  // Name of NodeJS installation configured in Jenkins
    }

    environment {
        // Scanner and Tools
        SCANNER_HOME = tool 'sonar-scanner'
        
        // Azure Container Registry
        ACR_NAME = 'hracrregistry'
        ACR_LOGIN_SERVER = 'hracrregistry.azurecr.io'
        IMAGE_NAME = 'hr-frontend'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        
        // Nexus Repository
        NEXUS_VERSION = 'nexus3'
        NEXUS_PROTOCOL = 'http'
        NEXUS_URL = '4.213.4.181:8081'
        NEXUS_REPOSITORY = 'hr-frontend-artifacts'
        NEXUS_CREDENTIAL_ID = 'nexus-credentials'
        
        // AKS Cluster
        AKS_CLUSTER_NAME = 'hr-aks-cluster'  // Replace with your AKS cluster name
        AKS_RESOURCE_GROUP = 'akshronix'
        K8S_NAMESPACE = 'hr-app'
        
        // Versioning
        ARTIFACT_VERSION = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/chandan-akshronix/HR_Comparator_FrontEnd.git', credentialsId: 'github-cred'
                echo "✅ Code checked out successfully"
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo "Installing frontend dependencies..."
                    sh """
                        npm install
                    """
                    echo "✅ Dependencies installed successfully"
                }
            }
        }

        stage('Trivy File System Scan') {
            steps {
                script {
                    echo "Running Trivy file system scan..."
                    sh """
                        trivy fs --severity HIGH,CRITICAL --format table .
                    """
                    echo "✅ Trivy file system scan completed"
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    echo "Building frontend application..."
                    sh """
                        npm run build
                    """
                    echo "✅ Application built successfully"
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    withSonarQubeEnv('sonar-scanner') {
                        sh """
                            ${SCANNER_HOME}/bin/sonar-scanner \
                              -Dsonar.projectKey=hr-frontend \
                              -Dsonar.projectName='HR Frontend' \
                              -Dsonar.sources=src \
                              -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**
                        """
                    }
                    echo "✅ SonarQube analysis completed"
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
                echo "✅ Quality Gate passed"
            }
        }



        stage('Package Artifacts') {
            steps {
                script {
                    echo "Packaging application artifacts..."
                    sh """
                        # Create artifact directory
                        mkdir -p artifacts
                        
                        # Package the build output
                        tar -czf artifacts/hr-frontend-${ARTIFACT_VERSION}.tar.gz \
                          --exclude='node_modules' \
                          --exclude='.git' \
                          --exclude='artifacts' \
                          .
                        
                        # Generate metadata file
                        cat > artifacts/metadata.json <<EOF
{
  "version": "${ARTIFACT_VERSION}",
  "build_number": "${BUILD_NUMBER}",
  "git_commit": "${GIT_COMMIT}",
  "build_timestamp": "\$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "artifact_name": "hr-frontend-${ARTIFACT_VERSION}.tar.gz",
  "image_name": "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}"
}
EOF
                    """
                    echo "✅ Artifacts packaged successfully"
                }
            }
        }

        stage('Deploy to Nexus') {
            steps {
                script {
                    echo "Deploying artifacts to Nexus Repository..."
                    
                    nexusArtifactUploader(
                        nexusVersion: NEXUS_VERSION,
                        protocol: NEXUS_PROTOCOL,
                        nexusUrl: NEXUS_URL,
                        groupId: 'com.hr.frontend',
                        version: ARTIFACT_VERSION,
                        repository: NEXUS_REPOSITORY,
                        credentialsId: NEXUS_CREDENTIAL_ID,
                        artifacts: [
                            [
                                artifactId: 'hr-frontend',
                                classifier: '',
                                file: "artifacts/hr-frontend-${ARTIFACT_VERSION}.tar.gz",
                                type: 'tar.gz'
                            ],
                            [
                                artifactId: 'hr-frontend',
                                classifier: 'metadata',
                                file: 'artifacts/metadata.json',
                                type: 'json'
                            ]
                        ]
                    )
                    
                    echo "✅ Artifacts deployed to Nexus successfully"
                }
            }
        }

        stage('Build and Tag Docker Image') {
            steps {
                script {
                    echo "Building and tagging Docker image..."
                    sh """
                        docker build -t ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} .
                        docker tag ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG} ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                    """
                    echo "✅ Docker image built and tagged successfully"
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                script {
                    echo "Running Trivy image security scan..."
                    sh """
                        trivy image \
                          --severity HIGH,CRITICAL \
                          --exit-code 0 \
                          --format table \
                          ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}
                    """
                    echo "✅ Trivy image scan completed"
                }
            }
        }

        stage('Push Image to ACR') {
            steps {
                script {
                    echo "Pushing Docker image to Azure Container Registry..."
                    withCredentials([usernamePassword(credentialsId: 'acr-credentials', usernameVariable: 'ACR_USERNAME', passwordVariable: 'ACR_PASSWORD')]) {
                        sh """
                            echo \$ACR_PASSWORD | docker login ${ACR_LOGIN_SERVER} -u \$ACR_USERNAME --password-stdin
                            docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}
                            docker push ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest
                            docker logout ${ACR_LOGIN_SERVER}
                        """
                    }
                    echo "✅ Docker images pushed to ACR successfully"
                }
            }
        }

        stage('Deploy to AKS') {
            steps {
                script {
                    echo "Deploying to Azure Kubernetes Service..."
                    
                    withCredentials([azureServicePrincipal('azure-credentials')]) {
                        sh """
                            # Login to Azure using service principal
                            az login --service-principal \
                              --username \$AZURE_CLIENT_ID \
                              --password \$AZURE_CLIENT_SECRET \
                              --tenant \$AZURE_TENANT_ID
                            
                            # Set subscription
                            az account set --subscription \$AZURE_SUBSCRIPTION_ID
                            
                            # Get AKS credentials
                            az aks get-credentials --resource-group ${AKS_RESOURCE_GROUP} --name ${AKS_CLUSTER_NAME} --overwrite-existing
                            
                            # Update deployment image tag to current build number
                            cd k8s
                            sed -i 's|image: hracrregistry.azurecr.io/hr-frontend:.*|image: ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}|g' deployment.yaml
                            
                            # Apply Kubernetes manifests
                            kubectl apply -f k8s/deployment.yaml
                            
                            # Wait for rollout to complete
                            kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=5m
                            
                            # Display deployment info
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            echo "Deployment Status:"
                            kubectl get deployment frontend -n ${K8S_NAMESPACE}
                            echo ""
                            echo "Pods:"
                            kubectl get pods -n ${K8S_NAMESPACE} -l app=frontend
                            echo ""
                            echo "Service:"
                            kubectl get svc frontend-service -n ${K8S_NAMESPACE}
                            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                            
                            # Logout
                            az logout
                        """
                    }
                    
                    echo "✅ Deployment to AKS completed successfully"
                }
            }
        }

        stage('Archive Build Info') {
            steps {
                script {
                    echo "Archiving build information..."
                    sh """
                        echo "Build Number: ${BUILD_NUMBER}" > build-info.txt
                        echo "Image Tag: ${IMAGE_TAG}" >> build-info.txt
                        echo "ACR Image: ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}" >> build-info.txt
                        echo "Nexus Artifact: hr-frontend-${ARTIFACT_VERSION}.tar.gz" >> build-info.txt
                        echo "Nexus URL: ${NEXUS_PROTOCOL}://${NEXUS_URL}/repository/${NEXUS_REPOSITORY}" >> build-info.txt
                        echo "Build Date: \$(date)" >> build-info.txt
                    """
                    archiveArtifacts artifacts: 'build-info.txt', fingerprint: true
                    echo "✅ Build information archived"
                }
            }
        }
    }

    post {
        success {
            echo "🎉 Pipeline completed successfully!"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📦 Nexus Artifact: hr-frontend-${ARTIFACT_VERSION}.tar.gz"
            echo "🐳 Docker Image: ${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}"
            echo "🔗 Nexus Repository: ${NEXUS_PROTOCOL}://${NEXUS_URL}/repository/${NEXUS_REPOSITORY}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs for details."
        }
        always {
            echo "Pipeline execution completed."
        }
    }
}
