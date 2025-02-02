"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const taskparameters_1 = require("./taskparameters");
const DeploymentFactory_1 = require("./deploymentProvider/DeploymentFactory");
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let isDeploymentSuccess = true;
        try {
            // Set user agent varable
            let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            let prefix = "";
            if (!!process.env.AZURE_HTTP_USER_AGENT) {
                prefix = `${process.env.AZURE_HTTP_USER_AGENT}`;
            }
            let actionName = 'Deploy Web Apps to Azure';
            core.exportVariable('AZURE_HTTP_USER_AGENT', `${prefix} GITHUBACTIONS_${actionName}_${usrAgentRepo}`);
            let taskParams = taskparameters_1.TaskParameters.getTaskParams();
            let type = DeploymentFactory_1.DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;
            // get app kind
            if (!!taskParams.endpoint) {
                yield taskParams.getResourceDetails();
                type = taskParams.kind.indexOf('linux') < 0 ? DeploymentFactory_1.DEPLOYMENT_PROVIDER_TYPES.WINDOWS : DeploymentFactory_1.DEPLOYMENT_PROVIDER_TYPES.LINUX;
            }
            var deploymentProvider = DeploymentFactory_1.DeploymentFactory.GetDeploymentProvider(type);
            core.debug("Predeployment Step Started");
            yield deploymentProvider.PreDeploymentStep();
            core.debug("Deployment Step Started");
            yield deploymentProvider.DeployWebAppStep();
        }
        catch (error) {
            core.debug("Deployment Failed with Error: " + error);
            isDeploymentSuccess = false;
            core.setFailed(error);
        }
        finally {
            if (deploymentProvider != null) {
                yield deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess, true);
            }
            core.debug(isDeploymentSuccess ? "Deployment Succeeded" : "Deployment failed");
        }
    });
}
main();
