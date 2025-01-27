/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import type { AppToDeploy } from "../models/AppToDeploy";

export class DefaultService {
  /**
   * Get Health
   * @returns any Successful Response
   * @throws ApiError
   */
  public static getHealthHealthGet(): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/health",
    });
  }
  /**
   * Post Task Deploy App
   * Clean up any existing tasks and start a new one
   * @param requestBody
   * @returns any Successful Response
   * @throws ApiError
   */
  public static postTaskDeployAppTaskDeployAppPost(
    requestBody: AppToDeploy
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/task/deploy-app",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Validation Error`,
      },
    });
  }
}
