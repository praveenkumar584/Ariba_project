const docusign = require('docusign-esign');
async function checkEnvelopeStatus(accessToken,accountId,envelopeId)
{
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath("https://demo.docusign.net/restapi");
    apiClient.addDefaultHeader("Authorization","Bearer " + accessToken);
    const envelopesApi =new docusign.EnvelopesApi(apiClient);
    const envelope = await envelopesApi.getEnvelope( accountId, envelopeId);
    const recipients = await envelopesApi.listRecipients(accountId,envelopeId);
    return {
        status: envelope.status,
        signer: recipients.signers?.[0]
    };
}
module.exports = { checkEnvelopeStatus };