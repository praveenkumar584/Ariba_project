const docusign = require('docusign-esign');
const fs = require('fs');
const path = require('path');
async function getAccessToken(docusign_dest)
{
    try
    {
        const jwtLifeSec = 10 * 60;
        const dsApiClient = new docusign.ApiClient();
        dsApiClient.setOAuthBasePath("account-d.docusign.com");
        const privateKey = fs.readFileSync( path.join(__dirname, '../keys/private.key') );

        const integrationKey = docusign_dest.originalProperties.DOCUSIGN_INTEGRATION_KEY;
        const userId = docusign_dest.originalProperties.DOCUSIGN_USER_ID;

        const results = await dsApiClient.requestJWTUserToken(
            integrationKey,
            userId,
            'signature impersonation',
            privateKey,
            jwtLifeSec
        );
        return {
            accessToken: results.body.access_token,
            apiClient: dsApiClient
        };
    }
   catch (error)
    {
        console.log("DOCUSIGN ERROR STATUS:",error.response?.status);
        console.log("DOCUSIGN ERROR DATA:",JSON.stringify(error.response?.data,null,2));
        throw error;
    }
}
module.exports = { getAccessToken };