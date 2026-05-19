const docusign =require('docusign-esign');
async function sendEnvelope(accessToken,accountId,excelBase64,signerEmail,signerName)
{
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath( "https://demo.docusign.net/restapi" );
    apiClient.addDefaultHeader( "Authorization","Bearer " + accessToken);
    const envelopesApi =new docusign.EnvelopesApi( apiClient);
    const document = new docusign.Document();
    document.documentBase64 = excelBase64;
    document.name = "BidDocument.xlsx";
    document.fileExtension = "xlsx";
    document.documentId = "1";
    const signer = new docusign.Signer();
    signer.email = signerEmail;
    signer.name = signerName;
    signer.recipientId = "1";
    signer.routingOrder = "1";
    const signHere = new docusign.SignHere();
    signHere.documentId = "1";
    signHere.pageNumber = "1";
    signHere.xPosition = "400";
    signHere.yPosition = "650";
    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    signer.tabs = tabs;
    const recipients = new docusign.Recipients();
    recipients.signers = [signer];
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = "Please Sign BID Document";
    envelopeDefinition.documents = [document];
    envelopeDefinition.recipients = recipients;
    envelopeDefinition.status = "sent";
    const result = await envelopesApi.createEnvelope(accountId,{envelopeDefinition});
    return result;
}
module.exports = { sendEnvelope };