const docusign = require('docusign-esign');
async function downloadSignedPdf(accessToken,accountId,envelopeId)
{

    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath("https://demo.docusign.net/restapi");
    apiClient.addDefaultHeader("Authorization","Bearer " + accessToken);
    const envelopesApi =new docusign.EnvelopesApi(apiClient);
    const pdfBuffer = await envelopesApi.getDocument( accountId,envelopeId,'combined');
    return pdfBuffer;
}
module.exports = { downloadSignedPdf };