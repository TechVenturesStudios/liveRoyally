import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "us-east-2_SPfoA3iIC", // your pool ID
  ClientId: "4g4mdd9a9651gkf1ho5lbfbsu5", // your client ID
};

export const userPool = new CognitoUserPool(poolData);

