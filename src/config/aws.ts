export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'eu-central-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-central-1_YU9xJaBX8',
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'u9fs5snjprcipkg65ef6k6spo',
};

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';
