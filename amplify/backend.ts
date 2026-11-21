import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { postConfirmation } from "./auth/post-confirmation/resource";
import { whoami } from "./whoami/resource";

const backend = defineBackend({ auth, data, storage, postConfirmation, whoami });

const apiStack = backend.createStack("rest-api-stack");
const api = new RestApi(apiStack, "RestApi", {
  restApiName: "ClashApi",
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: Cors.DEFAULT_HEADERS,
  },
});
const authorizer = new CognitoUserPoolsAuthorizer(apiStack, "Authorizer", {
  cognitoUserPools: [backend.auth.resources.userPool],
});
api.root.addResource("me").addMethod(
  "GET",
  new LambdaIntegration(backend.whoami.resources.lambda),
  { authorizer, authorizationType: AuthorizationType.COGNITO },
);

backend.addOutput({
  custom: { API: { endpoint: api.url, region: Stack.of(api).region } },
});
