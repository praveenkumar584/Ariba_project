const docusign =require('docusign-esign');
const { promisify } = require('util');
const { convertExcelToPdf } = require('./convertExcelToPdf');

async function sendEnvelope(accessToken,accountId,excelBase64,signerEmail,signerName)
{  
    const pdfBase64 = await convertExcelToPdf(excelBase64);
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath( "https://demo.docusign.net/restapi" );
    apiClient.addDefaultHeader( "Authorization","Bearer " + accessToken);
    const envelopesApi =new docusign.EnvelopesApi( apiClient);
    const document = new docusign.Document();
    document.documentBase64 = pdfBase64;
    document.name = "BidDocument.pdf";
    document.fileExtension = "pdf";
    document.documentId = "1";
    const signer = new docusign.Signer();
    signer.email = signerEmail;
    signer.name = signerName;
    signer.recipientId = "1";
    signer.routingOrder = "1";
    const signHere = new docusign.SignHere();
    signHere.documentId = "1";
    signHere.pageNumber = "1";
    signHere.xPosition = "300";
    signHere.yPosition = "450";
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
    console.log("Envelope Sent. Envelope ID:", result.envelopeId);
    return result;
}
module.exports = { sendEnvelope };