service apiServiceConsumption
{

  function getTemplateFile(eventId: String) returns LargeString;
  action downloadTemplateFile(downloadId : String);
  //Docusign Part
  action sendToDocusign(signerEmail: String, signerName: String) returns LargeString;
  action downloadSignedPdf(envelopeId : String) returns String;
}