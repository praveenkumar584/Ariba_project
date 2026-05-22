service apiServiceConsumption
{
  function getTemplateFile(eventId: String) returns LargeString;
  action sendToDocusign(signerEmail: String,  signerName: String) returns LargeString;
  action downloadSignedPdf(envelopeId : String) returns String;
}