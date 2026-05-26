import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.COGNITO_USER_POOL_ID, // your pool ID
  ClientId: process.env.COGNITO_CLIENT_ID, // your client ID
};

export const userPool = new CognitoUserPool(poolData);

